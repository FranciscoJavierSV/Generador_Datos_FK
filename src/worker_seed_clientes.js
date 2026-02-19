const { workerData, parentPort } = require("worker_threads");
const { MongoClient, ObjectId, Decimal128 } = require("mongodb");
const faker = require("@faker-js/faker").faker;

// Oficinas/sucursales ficticias pero constantes
const SUCURSALES = {
  "5f4564baf25d554a7f2b2818": "Sucursal Principal",
  "5f4564baf25d554a7f2b2819": "Sucursal Norte",
  "5f4564baf25d554a7f2b281a": "Sucursal Sur",
  "5f4564baf25d554a7f2b281b": "Sucursal Este",
  "5f4564baf25d554a7f2b281c": "Sucursal Oeste"
};

const EMPRESAS = {
  "5fd9545f6dce8d6e9f0c7dde": "Empresa Principal",
  "5fd9545f6dce8d6e9f0c7ddf": "Empresa Secundaria"
};

const LISTAS_PRECIOS = {
  "5f453c37ba107821fcc5a9f6": "Lista Minorista",
  "5f453c37ba107821fcc5a9f7": "Lista Mayorista",
  "5f453c37ba107821fcc5a9f8": "Lista Distribuidor"
};

function generarCliente(index, sucursal, empresa, listaPrecios) {
  const nombreGenerado = faker.person.firstName();
  const apellidoPaterno = faker.person.lastName();
  const apellidoMaterno = faker.person.lastName();

  return {
    _id: new ObjectId(),
    listaPrecios: {
      fechaRegistro: faker.date.past(),
      _idListaPrecios: listaPrecios._id
    },
    fechaRegistro: faker.date.past(),
    activo: faker.datatype.boolean({ likelihood: 80 }),
    direccionEnvio: {
      idCodigoPostal: faker.number.int({ min: 1, max: 999 }),
      idEstado: faker.number.int({ min: 1, max: 32 }),
      idCiudad: faker.number.int({ min: 1, max: 500 }),
      calle: faker.location.street(),
      colonia: faker.location.secondaryAddress(),
      numeroExterior: faker.number.int({ min: 1, max: 999 }).toString(),
      numeroInterior: null
    },
    direccionesIguales: faker.datatype.boolean({ likelihood: 70 }),
    direccionFacturacion: {
      idCodigoPostal: faker.number.int({ min: 1, max: 999 }),
      idEstado: faker.number.int({ min: 1, max: 32 }),
      idCiudad: faker.number.int({ min: 1, max: 500 }),
      calle: faker.location.street(),
      colonia: faker.location.secondaryAddress(),
      numeroExterior: faker.number.int({ min: 1, max: 999 }).toString(),
      numeroInterior: null
    },
    tieneRepresentante: faker.datatype.boolean({ likelihood: 20 }),
    telefonos: Array.from({ length: faker.number.int({ min: 0, max: 3 }) }, () => ({
      tipo: faker.helpers.arrayElement(["casa", "móvil", "trabajo"]),
      numero: faker.phone.number()
    })),
    historialListaPrecios: [],
    tipoDePersona: faker.helpers.arrayElement([1, 2]),
    correo: faker.internet.email(),
    rutaFoto: "default\\foto\\foto.jpg",
    nombreFoto: "foto.jpg",
    nombre: nombreGenerado.toUpperCase(),
    apepat: apellidoPaterno.toUpperCase(),
    apemat: apellidoMaterno.toUpperCase(),
    rfc: `${apellidoPaterno.slice(0, 2)}${apellidoMaterno.slice(0, 2)}${nombreGenerado.slice(0, 2)}${faker.number.int({ min: 100000, max: 999999 })}`.toUpperCase(),
    _idSucursal: sucursal._id,
    _idAccesoUsuario: sucursal._idAccesoUsuario,
    _idUsuario: sucursal._idUsuario,
    id: index,
    __v: 0,
    _idEmpresa: empresa._id,
    saldoAFavor: Decimal128.fromString(
      faker.number.float({ min: 0, max: 5000, precision: 0.01 }).toFixed(2)
    ),
    tipo: faker.helpers.arrayElement([1, 2, 3])
  };
}

async function run({ start = 0, end = 0, batch = 1000, uri = "mongodb://localhost:27017" }) {
  // convertir los parámetros a número para evitar cadenas o valores '***' en logs
  start = Number(start);
  end = Number(end);
  batch = Number(batch);

  // si el usuario pasó valores extraños, fallar rápido
  if (isNaN(start) || isNaN(end) || isNaN(batch) || batch <= 0) {
    throw new Error(`Parámetros inválidos start=${start} end=${end} batch=${batch}`);
  }

  // si no hay trabajo, salir sin tocar la BD
  if (start >= end) {
    if (parentPort) parentPort.postMessage({ status: "done" });
    return;
  }

  try {
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db("test");
    const collection = db.collection("clientes");

    // Crear referencias constantes
    const sucursales = Object.entries(SUCURSALES).map(([id, nombre]) => ({
      _id: new ObjectId(id),
      _idAccesoUsuario: new ObjectId(),
      _idUsuario: new ObjectId(),
      nombre
    }));

    const empresas = Object.entries(EMPRESAS).map(([id, nombre]) => ({
      _id: new ObjectId(id),
      nombre
    }));

    const listasPreciosArray = Object.entries(LISTAS_PRECIOS).map(([id, nombre]) => ({
      _id: new ObjectId(id),
      nombre
    }));

    for (let i = start; i < end; i += batch) {
      const docs = [];
      for (let j = i; j < Math.min(i + batch, end); j++) {
        const sucursal = faker.helpers.arrayElement(sucursales);
        const empresa = faker.helpers.arrayElement(empresas);
        const listaPrecios = faker.helpers.arrayElement(listasPreciosArray);
        docs.push(generarCliente(j, sucursal, empresa, listaPrecios));
      }

      // ✅ Validación para evitar lotes vacíos
      if (docs.length > 0) {
        await collection.insertMany(docs);
        console.log(`[Clientes] Insertados ${Math.min(i + batch, end)}/${end}`);
      } else {
        // se debería dar muy raramente, pero si ocurre lo registramos
        console.log(`[Clientes] Saltando lote vacío (${i} - ${Math.min(i+batch,end)})`);
      }
    }

    await client.close();
    if (parentPort) {
      parentPort.postMessage({ status: "done" });
    }
    return;
  } catch (err) {
    console.error("Error en worker_seed_clientes:", err);
    if (parentPort) {
      parentPort.postMessage({ status: "error", message: err.message || String(err) });
    }
    // Re-throw para que, si se ejecuta en single-thread, el proceso padre reciba el rechazo
    throw err;
  }
}

module.exports = { run };

// Si el archivo se ejecuta como Worker thread, arrancar automáticamente
if (typeof workerData !== "undefined" && workerData !== null) {
  run(workerData).catch((err) => {
    // ya se envió mensaje al padre en el catch interno; asegurar salida no silenciosa
    process.exit(1);
  });
}
