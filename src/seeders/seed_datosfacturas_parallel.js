const fs = require("fs");
const args = require("minimist")(process.argv.slice(2));

if (!fs.existsSync("/.dockerenv")) {
  console.error("❌ Ejecución restringida a contenedor Docker (usar docker-compose).");
  process.exit(1);
}

const batch = args.batch || process.env.SEED_BATCH || 10000;
const uri = args.uri || process.env.MONGO_URI || "mongodb://localhost:27017";

console.log(`📌 Seeding DatosFactura: basado en facturas existentes`);

require("../workers/worker_seed_datosfacturas").run({ batch, uri });
