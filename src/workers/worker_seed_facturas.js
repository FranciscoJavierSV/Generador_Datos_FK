const { workerData, parentPort } = require("worker_threads");
const { ObjectId } = require("mongodb");
const { Kafka } = require("kafkajs");
const faker = require("@faker-js/faker").faker;

function generarFactura(index, cliente) {
  return {
    _id: new ObjectId(),
    _idCliente: cliente._id,
    fecha: faker.date.past(),
    activo: true,
    subtotal: faker.number.float({ min: 100, max: 5000, precision: 0.01 }),
    descuento: faker.number.float({ min: 0, max: 500, precision: 0.01 }),
    iva: faker.number.float({ min: 0, max: 1000, precision: 0.01 }),
    total: faker.number.float({ min: 100, max: 6000, precision: 0.01 }),
    observaciones: faker.lorem.sentence(),
    // referencias y metadatos extra
    _idSucursal: cliente._idSucursal,
    _idEmpresa: cliente._idEmpresa,
    _idUsuario: cliente._idUsuario,
    _idAccesoUsuario: cliente._idAccesoUsuario || cliente._id, // fallback
    id: index,
    __v: 0,
    // campos clavados que no necesariamente existen en otras tablas
    formaDePago: new ObjectId(),
    moneda: new ObjectId(),
    tipoDeComprobante: new ObjectId(),
    usoDelCFDI: new ObjectId(),
    metodoDePago: new ObjectId(),
    _idArchivoFiscal: new ObjectId(),
    serie: faker.helpers.arrayElement(["A", "B", "C", "SFP"]),
    folio: faker.number.int({ min: 1, max: 10000 }),
    uuid: faker.string.uuid(),
    version: "3.3",
    ieps: 0,
    retencionIeps: 0,
    tieneRetencionIeps: false,
    tipoDeCambio: 1,
    _type: 'facturas'
  };
}

async function run({ start = 0, end = 0, batch = 1000, uri = "mongodb://localhost:27017" }) {
  start = Number(start);
  end = Number(end);
  batch = Number(batch);
  if (isNaN(start) || isNaN(end) || isNaN(batch) || batch <= 0) {
    throw new Error(`Parámetros inválidos start=${start} end=${end} batch=${batch}`);
  }
  if (start >= end) {
    if (parentPort) parentPort.postMessage({ status: "done" });
    return;
  }

  try {
    const kafka = new Kafka({
      clientId: 'seed-facturas',
      brokers: (process.env.KAFKA_BROKERS || 'kafka:9092').split(','),
      connectionTimeout: 10000,
      requestTimeout: 10000,
      retry: {
        initialRetryTime: 300,
        retries: 8,
        randomizationFactor: 0.2,
        multiplier: 2,
        maxRetryTime: 30000
      }
    });
    const producer = kafka.producer({
      compression: 1, // Gzip compression
      maxInFlightRequests: 5,
      idempotent: true
    });
    console.log(`[Facturas] Intentando conectar a Kafka: ${process.env.KAFKA_BROKERS || 'kafka:9092'}...`);
    await producer.connect();
    console.log(`[Facturas] Conectado exitosamente a Kafka`);

    // Simular clientes para generar facturas
    const clientes = Array.from({ length: 100 }, (_, i) => ({
      _id: new ObjectId(),
      _idSucursal: new ObjectId(),
      _idEmpresa: new ObjectId(),
      _idUsuario: new ObjectId(),
      _idAccesoUsuario: new ObjectId()
    }));

    for (let i = start; i < end; i += batch) {
      const docs = [];
      for (let j = i; j < Math.min(i + batch, end); j++) {
        const cliente = faker.helpers.arrayElement(clientes);
        docs.push(generarFactura(j, cliente));
      }
      if (docs.length > 0) {
        const messages = docs.map(doc => ({
          value: JSON.stringify(doc)
        }));
        await producer.send({
          topic: 'data',
          messages: messages
        });
        if ((i / batch) % 10 === 0) {
          console.log(`[Facturas] Progreso ${Math.min(i + batch, end)}/${end}`);
        }
      }
    }

    await producer.disconnect();
    if (parentPort) {
      parentPort.postMessage({ status: "done" });
    }
  } catch (error) {
    console.error(`[Facturas] ERROR: ${error.message}`);
    if (parentPort) parentPort.postMessage({ status: "error", message: error.message });
    throw error;
  }
}

module.exports = { run };

// Si el archivo se ejecuta como Worker thread, arrancar automáticamente
if (typeof workerData !== "undefined" && workerData !== null) {
  run(workerData).catch((err) => {
    process.exit(1);
  });
}