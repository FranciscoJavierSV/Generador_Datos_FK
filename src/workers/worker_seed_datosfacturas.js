const { workerData, parentPort } = require("worker_threads");
const { ObjectId } = require("mongodb");
const { Kafka } = require("kafkajs");
const faker = require("@faker-js/faker").faker;

// reutilizamos claves SAT de productos para mantener coherencia
const CSAT_CLAVE_PROD = {
  "5ee39b4867afd517cc8905e1": "60131600",
  "5ee39b4867afd517cc8905e2": "60131601",
  "5ee39b4867afd517cc8905e3": "60131602"
};

const CLAVES_UNIDAD = {
  "5ee39b9b67afd517cc89d72d": "Pie Tablar",
  "5ee39b9b67afd517cc89d72e": "Pieza",
  "5ee39b9b67afd517cc89d72f": "Metro Cuadrado"
};

function generarDato(factura, index, producto) {
  return {
    _id: new ObjectId(),
    _idFactura: factura._id,
    claveProdServ: faker.helpers.arrayElement(
      Object.keys(CSAT_CLAVE_PROD).map((k) => new ObjectId(k))
    ),
    claveUnidad: faker.helpers.arrayElement(
      Object.keys(CLAVES_UNIDAD).map((k) => new ObjectId(k))
    ),
    total_retenciones: faker.number.int({ min: 0, max: 2000 }).toString(),
    iva_total: faker.number.int({ min: 0, max: 1000 }),
    descuento: faker.number.int({ min: 0, max: 500 }),
    iva_unitario: faker.number.int({ min: 0, max: 500 }).toString(),
    precio_total: faker.number.int({ min: 100, max: 5000 }).toString(),
    producto: producto ? producto.nombre : faker.commerce.productName(),
    detalle: faker.commerce.productDescription(),
    cantidad_producto: faker.number.int({ min: 1, max: 10 }),
    precio_unitario: faker.number.int({ min: 10, max: 1000 }).toString(),
    por_iva_unitario: faker.number.int({ min: 0, max: 16 }).toString(),
    ret_iva: faker.number.int({ min: 0, max: 1000 }).toString(),
    ret_isr: faker.number.int({ min: 0, max: 1000 }).toString(),
    cantidad_dcto: faker.number.int({ min: 0, max: 500 }).toString(),
    id: index,
    __v: 0,
    trasladoIeps: 0,
    porcentajeTrasladoIeps: 0,
    tieneTrasladoIeps: false,
    retencionIeps: 0,
    porcentajeRetencionIeps: 0,
    tieneRetencionIeps: false,
    _idEmpresa: factura._idEmpresa,
    _type: 'datosfacturas'
  };
}

async function run({ batch = 100, uri = "mongodb://localhost:27017" }) {
  try {
    const kafka = new Kafka({
      clientId: 'seed-datosfacturas',
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
    console.log(`[DatosFactura] Intentando conectar a Kafka: ${process.env.KAFKA_BROKERS || 'kafka:9092'}...`);
    await producer.connect();
    console.log(`[DatosFactura] Conectado exitosamente a Kafka`);

    // Simular facturas y productos para generar datos de facturas
    const numFacturas = 50;
    const facturas = Array.from({ length: numFacturas }, (_, i) => ({
      _id: new ObjectId(),
      _idEmpresa: new ObjectId()
    }));

    const numProductos = 100;
    const productos = Array.from({ length: numProductos }, (_, i) => ({
      _id: new ObjectId(),
      nombre: faker.commerce.productName()
    }));

    console.log(`[DatosFactura] Generando para ${facturas.length} facturas`);

    let total = 0;
    const datosBuffer = [];

    for (const fact of facturas) {
      const num = faker.number.int({ min: 1, max: 5 });
      for (let i = 0; i < num; i++) {
        const producto = faker.helpers.arrayElement(productos);
        datosBuffer.push(generarDato(fact, i, producto));
      }

      // Enviar en lotes a Kafka
      while (datosBuffer.length >= batch) {
        const messages = datosBuffer.splice(0, batch).map(doc => ({
          value: JSON.stringify(doc)
        }));
        await producer.send({
          topic: 'data',
          messages: messages
        });
        total += messages.length;
        if (total % (batch * 10) === 0) {
          console.log(`[DatosFactura] Total enviados: ${total}`);
        }
      }
    }

    // Enviar datos restantes
    if (datosBuffer.length > 0) {
      const messages = datosBuffer.map(doc => ({
        value: JSON.stringify(doc)
      }));
      await producer.send({
        topic: 'data',
        messages: messages
      });
      total += messages.length;
    }

    console.log(`[DatosFactura] ✅ Total generados: ${total}`);

    await producer.disconnect();
    if (parentPort) {
      parentPort.postMessage({ status: "done" });
    }
  } catch (error) {
    console.error(`[DatosFactura] ERROR: ${error.message}`);
    if (parentPort) parentPort.postMessage({ status: "error", message: error.message });
    throw error;
  }
}

module.exports = { run };