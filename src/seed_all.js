const { spawn } = require("child_process");

const SEED_N = process.env.SEED_N || 500000;
const SEED_BATCH = process.env.SEED_BATCH || 10000;
const SEED_WORKERS = process.env.SEED_WORKERS || 4;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017";

console.log("🔄 Iniciando seeding completo...");
console.log(`📊 Configuración:`);
console.log(`   - Total: ${SEED_N} registros`);
console.log(`   - Batch: ${SEED_BATCH}`);
console.log(`   - Workers: ${SEED_WORKERS}`);
console.log(`   - MongoDB: ${MONGO_URI}`);
console.log("");

function runScript(scriptPath, name) {
  return new Promise((resolve, reject) => {
    console.log(`\n▶️  ${name}...`);
    const startTime = Date.now();

    const childProcess = spawn("node", [scriptPath], {
      env: {
        ...process.env,
        SEED_N: SEED_N,
        SEED_BATCH: SEED_BATCH,
        SEED_WORKERS: SEED_WORKERS,
        MONGO_URI: MONGO_URI
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
    await runScript("./src/seed_clientes_parallel.js", "Generando clientes");

    // 2. Generar productos
    await runScript("./src/seed_productos_parallel.js", "Generando productos");

    // 3. Generar variaciones (basadas en productos)
    await runScript("./src/seed_variaciones_parallel.js", "Generando variaciones");

    console.log("\n✅ 🎉 ¡Seeding completado con éxito!");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error durante el seeding:", error.message);
    process.exit(1);
  }
}

main();
