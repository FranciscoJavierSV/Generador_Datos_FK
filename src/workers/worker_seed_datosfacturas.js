const { workerData, parentPort } = require("worker_threads");
const { MongoClient, ObjectId } = require("mongodb");
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
    _idEmpresa: factura._idEmpresa
  };
}

async function run({ batch, uri }) {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db("test");
  const colFacturas = db.collection("facturas");
  const colProductos = db.collection("productos");
  const colDatos = db.collection("datosfactura");

  const facturas = await colFacturas.find().toArray();
  const productos = await colProductos.find().toArray();

  console.log(`[DatosFactura] Generando para ${facturas.length} facturas`);

  let total = 0;
  for (const fact of facturas) {
    const num = faker.number.int({ min: 1, max: 5 });
    const docs = [];
    for (let i = 0; i < num; i++) {
      const producto = faker.helpers.arrayElement(productos);
      docs.push(generarDato(fact, i, producto));
    }
    if (docs.length) {
      await colDatos.insertMany(docs);
      total += docs.length;
      if (total % (batch * 10) === 0) {
        console.log(`[DatosFactura] Total insertados: ${total}`);
      }
    }
  }

  console.log(`[DatosFactura] ✅ Total generados: ${total}`);

  await client.close();
  if (parentPort) {
    parentPort.postMessage("done");
  }
}

module.exports = { run };