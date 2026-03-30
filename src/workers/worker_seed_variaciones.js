const { workerData, parentPort } = require("worker_threads");
const { ObjectId } = require("mongodb");
const { Kafka } = require("kafkajs");
const faker = require("@faker-js/faker").faker; // Ya tenía Kafka importado

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
        precio: faker.number.float({ min: 10, max: Math.max((producto.precio || 500) * 1.2, 11), precision: 0.01 }),

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
    _idEmpresa: producto._idEmpresa,
    _type: 'variaciones'
  };
}

async function run({ start, end, batch, uri }) {
  try {
    const kafka = new Kafka({
      clientId: 'seed-variaciones',
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
    console.log(`[Variaciones] Intentando conectar a Kafka: ${process.env.KAFKA_BROKERS || 'kafka:9092'}...`);
    await producer.connect();
    console.log(`[Variaciones] Conectado exitosamente a Kafka`);

    // Obtener referencias para listas de precios
    const listasPreciosArray = Object.entries(LISTAS_PRECIOS).map(([id, nombre]) => ({
      _id: new ObjectId(id),
      nombre
    }));

    // Simular productos con variaciones (generar en cliente)
    const numProductos = 50; // Cantidad de productos para generar
    const productosConVariaciones = [];
    for (let i = 0; i < numProductos; i++) {
      productosConVariaciones.push({
        _id: new ObjectId(),
        nombre: faker.commerce.productName(),
        precio: faker.number.float({ min: 10, max: 10000, precision: 0.01 }),
        tieneVariaciones: true,
        _idSucursal: new ObjectId(),
        _idEmpresa: new ObjectId(),
        _idUsuario: new ObjectId(),
        _idAccesoUsuario: new ObjectId()
      });
    }

    console.log(
      `[Variaciones] Generando variaciones para ${productosConVariaciones.length} productos`
    );

    let totalVariacionesInsertadas = 0;
    const variacionsBuffer = [];

    // Por cada producto con variaciones
    for (const producto of productosConVariaciones) {
      const numVariaciones = faker.number.int({ min: 1, max: 10 });

      for (let i = 0; i < numVariaciones; i++) {
        const listaPrecios = faker.helpers.arrayElement(listasPreciosArray);
        variacionsBuffer.push(generarVariacion(producto, i, listaPrecios));
      }

      // Enviar en lotes a Kafka
      if (variacionsBuffer.length >= batch) {
        const messages = variacionsBuffer.splice(0, batch).map(doc => ({
          value: JSON.stringify(doc)
        }));
        await producer.send({
          topic: 'data',
          messages: messages
        });
        totalVariacionesInsertadas += messages.length;
        
        if (totalVariacionesInsertadas % (batch * 10) === 0) {
          console.log(`[Variaciones] Total enviadas: ${totalVariacionesInsertadas}`);
        }
      }
    }

    // Enviar variaciones restantes
    if (variacionsBuffer.length > 0) {
      const messages = variacionsBuffer.map(doc => ({
        value: JSON.stringify(doc)
      }));
      await producer.send({
        topic: 'data',
        messages: messages
      });
      totalVariacionesInsertadas += messages.length;
    }

    console.log(`[Variaciones] ✅ Completado. Total generadas: ${totalVariacionesInsertadas}`);

    await producer.disconnect();
    if (parentPort) {
      parentPort.postMessage({ status: "done" });
    }
  } catch (error) {
    console.error(`[Variaciones] ERROR: ${error.message}`);
    if (parentPort) parentPort.postMessage({ status: "error", message: error.message });
    throw error;
  }
}

module.exports = { run };
