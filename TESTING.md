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
Los contenedores construidos a partir del `Dockerfile` instalan las
dependencias necesarias (`npm install` se ejecuta durante la build). No es
necesario ejecutar estos comandos en el host.
### 3. MongoDB Disponible
Asegúrate de que `MONGO_URI` apunta a tu clúster de Atlas y que las
credenciales son válidas.

```bash
# Verifica conectividad
mongosh "$MONGO_URI" \
  --eval "db.adminCommand('ping')"
# Esperado: { ok: 1 }
```

## 🚀 Ejecución únicamente con contenedores

Todos los procesos deben ejecutarse dentro de Docker. El `Dockerfile` y
los `docker-compose` existentes ya se encargan de instalar dependencias
(incluyendo `npm`).

Para correr el seeding tradicional con Kafka y sin ningún servicio de
Mongo local:

```bash
docker-compose up --build
```
Si deseas forzar un Mongo local también, utiliza el profile correspondiente:

```bash
docker-compose --profile withmongo up --build
```

Si necesitas ejecutar un solo script dentro del contenedor puedes usar
`run`:

```bash
docker-compose run --rm seed_app node src/seeders/seed_clientes_parallel.js
```

Cuando uses el pipeline Kafka, ejecuta el compose correspondiente:

```bash
docker-compose -f docker-compose.kafka.yml up --build
```

El producer/consumer se levantan como servicios (`consumer` ya está
definido); el producer también puede lanzarse manualmente con
`docker-compose run --rm consumer node src/kafka/producer.js`.

## 🐳 Ejecución con Docker

### Construcción
```bash
cd /home/javi/baseDR
docker build -t basedр:latest .
```

### Ejecución
```bash
# Con docker-compose (recomendado)
# asegúrate de que el .env contiene la URI de Atlas

docker-compose up --build

# O bien el stack Kafka con métricas

docker-compose -f docker-compose.kafka.yml up --build
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

### Problema: "ECONNREFUSED / error de conexión a Atlas"
```bash
# Solución: Revisa `MONGO_URI` y la red a Atlas
docker run -d -p 27017:27017 mongo:8.0

# O usa docker-compose
docker-compose up mongo
```

### Problema: "Cannot find module 'minimist'"
Se produce si el contenedor no se ha reconstruido. Vuelve a levantarlo:
```bash
docker-compose build
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
Puedes usar el tiempo que tarda el contenedor en ejecutar el comando:
```bash
time docker-compose run --rm seed_app node src/seed_all.js
```
### Monitorear durante ejecución
```bash
# En otra terminal
watch -n 1 'mongosh "$MONGO_URI" --eval "
  use test;
  print(\"Clientes: \" + db.clientes.countDocuments());
  print(\"Productos: \" + db.productos.countDocuments());
  print(\"Variaciones: \" + db.variaciones.countDocuments());
"'
```

## ✅ Checklist Final

- [ ] MongoDB está corriendo
- [ ] contenedores construidos correctamente
- [ ] Sintaxis validada (node -c)
- [ ] Base de datos está vacía (o limpiada)
- [ ] Variables de entorno correctas
- [ ] Ejecutar seed_all.js o el script individual
- [ ] Verificar conteos finales
- [ ] Validar coherencia de referencias
- [ ] Verificar logs para errores
