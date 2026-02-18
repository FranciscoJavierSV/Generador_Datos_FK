# 🧪 Guía de Testing y Debugging

## ✅ Verificaciones Rápidas

### 1. Sintaxis JavaScript
```bash
cd /home/javi/baseDR
node -c src/seed_all.js
node -c src/worker_seed_clientes.js
node -c src/worker_seed_productos.js
node -c src/worker_seed_variaciones.js
```

### 2. Dependencias
```bash
npm install
npm list
```

### 3. MongoDB Disponible
```bash
# Inicia MongoDB (Docker)
docker run -d -p 27017:27017 --name mongo mongo:8.0

# Verifica conectividad
mongosh mongodb://localhost:27017
> db.adminCommand('ping')
# Esperado: { ok: 1 }
```

## 🚀 Ejecución (solo Docker)

# Contar clientes y productos por separado
Puedes pasar `SEED_N_CLIENTES` y `SEED_N_PRODUCTOS` en el `.env` o en la
línea de arranque si quieres generar cantidades distintas. Por ejemplo:

```bash
# 100k clientes y 300k productos
SEED_N_CLIENTES=100000 SEED_N_PRODUCTOS=300000 \
  docker-compose up --build
```


Los scripts están diseñados para ejecutarse desde un contenedor. Cualquier
invocación directa a `node` terminará con un mensaje de error. Usa los comandos
siguientes para pruebas rápidas.

```bash
# iniciar con configuración del entorno definido en .env
docker-compose up --build

# ejecutar un solo proceso dentro del servicio de seeding
docker-compose run --rm seed_app node src/seed_clientes_parallel.js
```

## 🐳 Ejecución con Docker

### Construcción
```bash
cd /home/javi/baseDR
docker build -t basedр:latest .
```

### Ejecución
```bash
# Con docker-compose (recomendado)
docker-compose up --build

# O solo el contenedor de seeding
docker run --network host -e MONGO_URI=mongodb://localhost:27017 basedр:latest
```

## 📊 Validación de Datos

### Conectarse a MongoDB
```bash
# la cadena de conexión depende de MONGO_URI configurado en .env
mongosh "$MONGO_URI"
use test
```

### Ver collections nuevas
```javascript
// Facturas creadas
db.facturas.countDocuments()
// Detalles de factura (datosfactura)
db.datosfactura.countDocuments()
```
### Verificar Colecciones
```javascript
// Contar documentos
db.clientes.countDocuments()         // Esperado: 500,000
db.productos.countDocuments()        // Esperado: 500,000
db.variaciones.countDocuments()      // Esperado: ~3,000,000 (variable)

// Ver un ejemplo de cada
db.clientes.findOne()
db.productos.findOne()
db.variaciones.findOne()
```

### Validaciones de Coherencia
```javascript
// 1. Verificar que tieneVariaciones tenga sentido
db.productos.aggregate([
  { $group: { _id: "$tieneVariaciones", count: { $sum: 1 } } }
])
// Esperado:
// { _id: true, count: ~300000 }
// { _id: false, count: ~200000 }

// 2. Verificar que variaciones apunten a productos reales
db.variaciones.aggregate([
  { $match: { _idProducto: { $exists: true } } },
  { $lookup: {
      from: "productos",
      localField: "_idProducto",
      foreignField: "_id",
      as: "producto"
    }
  },
  { $match: { producto: { $eq: [] } } }
])
// Esperado: 0 documentos (sin productos huérfanos)

// 3. Verificar coherencia de referencias
db.variaciones.findOne({ tieneColores: true })
const variacion = db.variaciones.findOne()
const producto = db.productos.findOne({ _id: variacion._idProducto })
// Verificar que coincidan:
// - usuario
// - empresa
// - sucursal

// 4. Contar variaciones solo de productos con tieneVariaciones=true
const productosConVar = db.productos.countDocuments({ tieneVariaciones: true })
const variacionesTotal = db.variaciones.countDocuments()
console.log(`Productos con variaciones: ${productosConVar}`)
console.log(`Total de variaciones: ${variacionesTotal}`)
console.log(`Promedio por producto: ${(variacionesTotal / productosConVar).toFixed(2)}`)
```

## 🔍 Debug Específico

### Verificar Nombres de Variaciones
```javascript
// Las variaciones deben tener nombres relacionados al producto
db.variaciones.aggregate([
  { $match: { _id: ObjectId("...") } },
  { $lookup: {
      from: "productos",
      localField: "_idProducto",
      foreignField: "_id",
      as: "producto"
    }
  },
  { $project: {
      variacionNombre: "$nombre",
      productoNombre: { $arrayElemAt: ["$producto.nombre", 0] }
    }
  }
]).pretty()
```

### Verificar References Constantes
```javascript
// Todas las empresas deberían ser del set constante
db.productos.distinct("_idEmpresa")
// Esperado: 2 ObjectIds

// Todas las sucursales deberían ser del set constante
db.productos.distinct("_idSucursal")
// Esperado: 5 ObjectIds

// Todas las monedas deberían ser del set constante
db.productos.distinct("_idMoneda")
// Esperado: 3 ObjectIds (y _idMonedaCosto = _idMoneda)
```

## ⚠️ Troubleshooting

### Problema: "ECONNREFUSED - MongoDB no disponible"
```bash
# Solución: Inicia MongoDB
docker run -d -p 27017:27017 mongo:8.0

# O usa docker-compose
docker-compose up mongo
```

### Problema: "Cannot find module 'minimist'"
```bash
# Solución:
npm install
```

### Problema: "SyntaxError: Unexpected token"
```bash
# Verifica que package.json NO tenga "type": "module"
# (YA ESTÁ CORREGIDO)

# Verifica sintaxis:
node -c src/seed_all.js
```

### Problema: "Workers quedan colgados"
```bash
# Aumenta el timeout o verifica logs:
docker logs seed_app
docker logs -f seed_app

# Verifica conexión a MongoDB:
mongosh mongodb://localhost:27017
```

### Limpiar Base de Datos
```javascript
use test
db.clientes.deleteMany({})
db.productos.deleteMany({})
db.variaciones.deleteMany({})
```

## 📈 Performance Benchmarking

### Medir tiempo total
```bash
time npm run seed
```

### Monitorear durante ejecución
```bash
# En otra terminal
watch -n 1 'mongosh mongodb://localhost:27017 --eval "
  use test;
  print(\"Clientes: \" + db.clientes.countDocuments());
  print(\"Productos: \" + db.productos.countDocuments());
  print(\"Variaciones: \" + db.variaciones.countDocuments());
"'
```

## ✅ Checklist Final

- [ ] MongoDB está corriendo
- [ ] npm install completado
- [ ] Sintaxis validada (node -c)
- [ ] Base de datos está vacía (o limpiada)
- [ ] Variables de entorno correctas
- [ ] Ejecutar seed_all.js o el script individual
- [ ] Verificar conteos finales
- [ ] Validar coherencia de referencias
- [ ] Verificar logs para errores
