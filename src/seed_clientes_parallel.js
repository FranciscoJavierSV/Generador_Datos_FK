const fs = require("fs");
const { Worker } = require("worker_threads");
const args = require("minimist")(process.argv.slice(2));

// enforce Docker-only execution
if (!fs.existsSync("/.dockerenv")) {
  console.error("❌ Este script sólo se ejecuta dentro de Docker. Usa docker-compose para iniciar.");
  process.exit(1);
}

// permite especificar un número distinto para clientes
const total =
  args.n ||
  process.env.SEED_N_CLIENTES ||
  process.env.SEED_N ||
  500000;
const batch = args.batch || process.env.SEED_BATCH || 10000;
const workers = args.workers || process.env.SEED_WORKERS || 4;
const uri = args.uri || process.env.MONGO_URI || "mongodb://localhost:27017";

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
