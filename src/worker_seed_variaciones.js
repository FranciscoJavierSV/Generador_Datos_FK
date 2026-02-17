const { workerData, parentPort } = require("worker_threads");
const { MongoClient, ObjectId } = require("mongodb");
const faker = require("@faker-js/faker").faker;

// Listas de precios ficticias pero constantes
const LISTAS_PRECIOS = {
  "5f4564bbf25d554a7f2b281a": "Lista Minorista",
  "5f4564bbf25d554a7f2b281b": "Lista Mayorista",
  "5f4564bbf25d554a7f2b281c": "Lista Distribuidor"
};

const COLORES = ["Rojo", "Azul", "Verde", "Negro", "Blanco", "Gris", "Amarillo", "Naranja", "Rosa", "Morado"];
const TALLAS = ["XS", "S", "M", "L", "XL", "XXL", "Pequeño", "Mediano", "Grande"];
const ESPECIFICACIONES = ["Material", "Peso", "Dimensiones", "Capacidad", "Voltaje", "Potencia"];

function generarVariacion(producto, index, listaPrecios) {
  // Determinar nombre con variante: color, talla, tamaño, modelo, etc.
  const variantes = [
    `${producto.nombre} - ${faker.helpers.arrayElement(TALLAS)}`,
    `${producto.nombre} - ${faker.helpers.arrayElement(COLORES)}`,
    `${producto.nombre} - ${faker.helpers.arrayElement(COLORES)} ${faker.helpers.arrayElement(TALLAS)}`,
    `${producto.nombre} - Modelo ${faker.number.int({ min: 1, max: 50 })}`,
  ];

  return {
    _id: new ObjectId(),
    fechaRegistro: faker.date.past(),
    activo: faker.datatype.boolean({ likelihood: 90 }),
    tieneColores: faker.datatype.boolean({ likelihood: 40 }),
    default: index === 0 ? true : false, // primera variación es default
    colores: faker.datatype.boolean({ likelihood: 40 })
      ? Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () =>
          faker.helpers.arrayElement(COLORES)
        )
      : [],
    imagenes: [],
    precios: [
      {
        _id: new ObjectId(),
        fechaRegistro: faker.date.past(),
        activo: true,
        precio: faker.number.float({ min: 10, max: producto.precio * 1.2 || 500, precision: 0.01 }),
        _idListaPrecios: listaPrecios._id
      }
    ],
    especificaciones: Array.from({ length: faker.number.int({ min: 0, max: 4 }) }, () => ({
      nombre: faker.helpers.arrayElement(ESPECIFICACIONES),
      valor: faker.commerce.productDescription().substring(0, 50)
    })),
    nombre: faker.helpers.arrayElement(variantes),
    upc: faker.string.alphanumeric(12).toUpperCase(),
    descripcion: faker.commerce.productDescription(),
    equivalencias: [],
    _idProducto: producto._id,
    _idUsuario: producto._idUsuario,
    _idAccesoUsuario: producto._idAccesoUsuario,
    _idSucursal: producto._idSucursal,
    id: index,
    __v: 0,
    _idEmpresa: producto._idEmpresa
  };
}

async function run({ start, end, batch, uri }) {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db("test");
  const collectionVariaciones = db.collection("variaciones");
  const collectionProductos = db.collection("productos");

  // Obtener referencias para listas de precios
  const listasPreciosArray = Object.entries(LISTAS_PRECIOS).map(([id, nombre]) => ({
    _id: new ObjectId(id),
    nombre
  }));

  // Consultar TODOS los productos con tieneVariaciones = true
  const productosConVariaciones = await collectionProductos
    .find({ tieneVariaciones: true })
    .toArray();

  console.log(
    `[Variaciones] Encontrados ${productosConVariaciones.length} productos con variaciones`
  );

  let totalVariacionesInsertadas = 0;

  // Por cada producto con variaciones
  for (const producto of productosConVariaciones) {
    const numVariaciones = faker.number.int({ min: 1, max: 10 });
    const variaciones = [];

    for (let i = 0; i < numVariaciones; i++) {
      const listaPrecios = faker.helpers.arrayElement(listasPreciosArray);
      variaciones.push(generarVariacion(producto, i, listaPrecios));
    }

    // Insertar variaciones en lotes
    if (variaciones.length > 0) {
      await collectionVariaciones.insertMany(variaciones);
      totalVariacionesInsertadas += variaciones.length;
      
      if (totalVariacionesInsertadas % (batch * 10) === 0) {
        console.log(`[Variaciones] Total insertadas: ${totalVariacionesInsertadas}`);
      }
    }
  }

  console.log(`[Variaciones] ✅ Completado. Total generadas: ${totalVariacionesInsertadas}`);

  await client.close();
  if (parentPort) {
    parentPort.postMessage("done");
  }
}

module.exports = { run };
