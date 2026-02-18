const { workerData, parentPort } = require("worker_threads");
const { MongoClient, ObjectId } = require("mongodb");
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
    tipoDeCambio: 1
  };
}

async function run({ start, end, batch, uri }) {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db("test");
  const colClientes = db.collection("clientes");
  const colFacturas = db.collection("facturas");

  const clientes = await colClientes.find().toArray();

  for (let i = start; i < end; i += batch) {
    const docs = [];
    for (let j = i; j < Math.min(i + batch, end); j++) {
      const cliente = faker.helpers.arrayElement(clientes);
      docs.push(generarFactura(j, cliente));
    }
    await colFacturas.insertMany(docs);
    console.log(`[Facturas] Insertados ${Math.min(i + batch, end)}/${end}`);
  }

  await client.close();
  if (parentPort) {
    parentPort.postMessage("done");
  }
}

module.exports = { run };