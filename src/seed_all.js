const { spawn } = require("child_process");
const fs = require("fs");

// ensure running inside Docker container
if (!fs.existsSync("/.dockerenv")) {
  console.error("❌ Este proyecto sólo puede ejecutarse dentro de un contenedor Docker.\n" +
                "   Usa 'docker-compose up' desde la raíz del repositorio.");
  process.exit(1);
}

// convertir y validar valores de entorno (evita problemas con secretos en
// los logs de GitHub que aparecen como '***')
let SEED_N = process.env.SEED_N || 500000;
let SEED_N_CLIENTES = process.env.SEED_N_CLIENTES || SEED_N;
let SEED_N_PRODUCTOS = process.env.SEED_N_PRODUCTOS || SEED_N;
let SEED_N_FACTURAS = process.env.SEED_N_FACTURAS || SEED_N;
let SEED_BATCH = process.env.SEED_BATCH || 10000;
let SEED_WORKERS = process.env.SEED_WORKERS || 4;

[SEED_N, SEED_N_CLIENTES, SEED_N_PRODUCTOS, SEED_N_FACTURAS, SEED_BATCH, SEED_WORKERS] =
  [SEED_N, SEED_N_CLIENTES, SEED_N_PRODUCTOS, SEED_N_FACTURAS, SEED_BATCH, SEED_WORKERS].map(
    (v) => Number(v)
  );

if ([SEED_N, SEED_BATCH, SEED_WORKERS].some((v) => isNaN(v) || v <= 0)) {
  console.error("❌ Variables de entorno inválidas, revisa .env o la configuración");
  process.exit(1);
}
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017";

console.log("🔄 Iniciando seeding completo...");
console.log(`📊 Configuración:`);
console.log(`   - Total: ${SEED_N} registros`);
console.log(`   - Batch: ${SEED_BATCH}`);
console.log(`   - Workers: ${SEED_WORKERS}`);
console.log(`   - MongoDB: ${MONGO_URI}`);
console.log("");

function runScript(scriptPath, name, extraEnv = {}) {
  return new Promise((resolve, reject) => {
    console.log(`\n▶️  ${name}...`);
    const startTime = Date.now();

    const childProcess = spawn("node", [scriptPath], {
      env: {
        ...process.env,
        SEED_N: SEED_N,
        SEED_BATCH: SEED_BATCH,
        SEED_WORKERS: SEED_WORKERS,
        MONGO_URI: MONGO_URI,
        ...extraEnv
      },
      stdio: "inherit"
    });

    childProcess.on("close", (code) => {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      if (code === 0) {
        console.log(`✅ ${name} completado en ${duration}s`);
        resolve();
      } else {
        reject(new Error(`${name} falló con código ${code}`));
      }
    });

    childProcess.on("error", (error) => {
      reject(error);
    });
  });
}

async function main() {
  try {
    // 1. Generar clientes
    await runScript("./src/seed_clientes_parallel.js", "Generando clientes", {
      SEED_N: SEED_N_CLIENTES
    });

    // 2. Generar productos
    await runScript("./src/seed_productos_parallel.js", "Generando productos", {
      SEED_N: SEED_N_PRODUCTOS
    });

    // 3. Generar variaciones (basadas en productos)
    await runScript("./src/seed_variaciones_parallel.js", "Generando variaciones");

    // 4. Generar facturas
    await runScript("./src/seed_facturas_parallel.js", "Generando facturas", {
      SEED_N: SEED_N_FACTURAS
    });

    // 5. Generar datos de factura (líneas) basados en las facturas creadas
    await runScript("./src/seed_datosfacturas_parallel.js", "Generando datos de factura");

    console.log("\n✅ 🎉 ¡Seeding completado con éxito!");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error durante el seeding:", error.message);
    process.exit(1);
  }
}

main();
