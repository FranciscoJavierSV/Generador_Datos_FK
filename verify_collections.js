const { MongoClient } = require('mongodb');

async function verify() {
  const mongoUri = 'mongodb://mongo:RNrIxyOgQgdlCbNJxdSBOddPeRnlYtjs@autorack.proxy.rlwy.net:34030';
  const client = new MongoClient(mongoUri);
  
  try {
    await client.connect();
    const db = client.db('baseDR');
    
    console.log('\n🔍 VERIFICACION DE COLECCIONES MONGODB:\n');
    
    const collections = ['clientes', 'productos', 'variaciones', 'facturas', 'datosfacturas', 'registros'];
    let totalDocs = 0;
    
    for (const col of collections) {
      const count = await db.collection(col).countDocuments();
      if (count > 0) {
        console.log(`  ✅ ${col.padEnd(15)}: ${count} documentos`);
        totalDocs += count;
      }
    }
    
    console.log(`\n  ═══════════════════════════════════\n  📊 TOTAL: ${totalDocs} documentos\n`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

verify();
