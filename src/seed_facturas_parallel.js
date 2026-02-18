const fs = require("fs");
const { Worker } = require("worker_threads");
const args = require("minimist")(process.argv.slice(2));

if (!fs.existsSync("/.dockerenv")) {
  console.error("❌ Este script sólo se ejecuta dentro de Docker. Usa docker-compose para iniciar.");
  process.exit(1);
}

// número de facturas a generar (puede venir de SEED_N_FACTURAS)
const total =
  args.n ||
  process.env.SEED_N_FACTURAS ||
  process.env.SEED_N ||
  100000;
const batch = args.batch || process.env.SEED_BATCH || 10000;
const workers = args.workers || process.env.SEED_WORKERS || 4;
const uri = args.uri || process.env.MONGO_URI || "mongodb://localhost:27017";

console.log(`📌 Seeding Facturas: ${total} registros con ${workers} workers`);

if (workers > 1) {
  const perWorker = Math.ceil(total / workers);
  for (let i = 0; i < workers; i++) {
    const start = i * perWorker;
    const end = Math.min(start + perWorker, total);
    new Worker("./src/worker_seed_facturas.js", {
      workerData: { start, end, batch, uri }
    });
  }
} else {
  require("./worker_seed_facturas").run({ start: 0, end: total, batch, uri });
}
