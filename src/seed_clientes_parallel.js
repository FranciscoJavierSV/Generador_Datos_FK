const fs = require("fs");
const { Worker } = require("worker_threads");
const args = require("minimist")(process.argv.slice(2));

// enforce Docker-only execution
if (!fs.existsSync("/.dockerenv")) {
  console.error("❌ Este script sólo se ejecuta dentro de Docker. Usa docker-compose para iniciar.");
  process.exit(1);
}

// permite especificar un número distinto para clientes
let total =
  args.n ||
  process.env.SEED_N_CLIENTES ||
  process.env.SEED_N ||
  500000;
let batch = args.batch || process.env.SEED_BATCH || 10000;
let workers = args.workers || process.env.SEED_WORKERS || 4;
const uri = args.uri || process.env.MONGO_URI || "mongodb://localhost:27017";

// Asegurar que sean números válidos (GitHub Actions enmascara valores y puede
// dejar cadenas asterisqueadas, lo que rompería las matemáticas de la división)
total = Number(total);
batch = Number(batch);
workers = Number(workers);

if (isNaN(total) || total < 0) {
  console.error("❌ Valor inválido para total (SEED_N):", total);
  process.exit(1);
}
if (isNaN(batch) || batch <= 0) {
  console.error("❌ Valor inválido para batch (SEED_BATCH):", batch);
  process.exit(1);
}
if (isNaN(workers) || workers <= 0) {
  console.error("❌ Valor inválido para workers (SEED_WORKERS):", workers);
  process.exit(1);
}

console.log(`📌 Seeding Clientes: ${total} registros con ${workers} workers`);

async function runWorkers() {
  if (workers > 1) {
    const perWorker = Math.ceil(total / workers);
    const promises = [];

    for (let i = 0; i < workers; i++) {
      const start = i * perWorker;
      const end = Math.min(start + perWorker, total);

      promises.push(new Promise((resolve, reject) => {
        const w = new Worker("./src/worker_seed_clientes.js", {
          workerData: { start, end, batch, uri }
        });

        w.on("message", (msg) => {
          if (msg && msg.status === "done") return resolve();
          if (msg && msg.status === "error") return reject(new Error(msg.message || "Worker error"));
        });

        w.on("error", (err) => reject(err));

        w.on("exit", (code) => {
          if (code === 0) return resolve();
          return reject(new Error(`Worker exited with code ${code}`));
        });
      }));
    }

    // esperar a que todos terminen (o fallen)
    await Promise.all(promises);
    console.log("✅ Todos los workers de clientes terminaron");
  } else {
    // single-threaded: ejecutar la función exportada y propagar errores
    try {
      await require("./worker_seed_clientes").run({ start: 0, end: total, batch, uri });
      console.log("✅ Seed clientes single-threaded completado");
    } catch (err) {
      throw err;
    }
  }
}

runWorkers()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Error en seed_clientes_parallel:", err.message);
    process.exit(1);
  });
