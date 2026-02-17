const { Worker } = require("worker_threads");
const args = require("minimist")(process.argv.slice(2));

const batch = args.batch || process.env.SEED_BATCH || 10000;
const uri = args.uri || process.env.MONGO_URI || "mongodb://localhost:27017";

console.log(`📌 Seeding Variaciones: generando según tieneVariaciones`);

// Las variaciones se generan basadas en productos que existen, así que no necesita start/end
require("./worker_seed_variaciones").run({ start: 0, end: undefined, batch, uri });
