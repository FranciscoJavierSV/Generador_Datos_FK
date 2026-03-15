# BaseDR - Seed Database con MongoDB

Aplicación Node.js para generar y poblar una base de datos MongoDB con datos realistas usando **workers paralelos** y la librería **Faker**.

## 📋 Descripción

Este proyecto automatiza la creación de grandes volúmenes de datos de prueba para múltiples colecciones MongoDB:
- **Clientes** - Información de clientes, direcciones, teléfonos
- **Productos** - Catálogo de productos
- **Variaciones** - Variaciones de productos (colores, tallas, etc.)

Utiliza **worker threads** para procesar datos en paralelo, haciendo el seeding **4x más rápido**.

> ⚠️ Se añadieron validaciones extra en los workers para impedir que se invoque
> `insertMany` con un lote vacío (error MongoInvalidArgumentError). Si ves
> ese mensaje en los logs significa que uno de los parámetros (`--n`,
> `--batch` o las variables de entorno) no era numérico o era 0.
> 
> Cada worker ahora también imprime sus parámetros al arrancar, algo como:
> 
> ```
> [Clientes worker] Parámetros recibidos start=0 end=125000 batch=10000 uri=...
> ```
> 
> Esto ayuda a comprobar en los logs de CI que se está ejecutando el código
> actualizado y con los valores correctos.
> La imagen se reconstruye automáticamente al levantar el contenedor.

---

## 🚀 Quick Start

### Requisitos
- Docker & Docker Compose (el único entorno soportado por el proyecto)

### Instalar y ejecutar

```bash
# 1. Clonar/entrar al proyecto
cd baseDR

# 2. Ejecutar con Docker
#    El contenedor de seeding comprueba que corre dentro de Docker y
cd baseDR

# 2. Ejecutar con Docker
#    El contenedor de seeding comprueba que corre dentro de Docker y
#    terminará si se invoca directamente desde Node.
#    El único compose en el repo ahora incluye Kafka/Zookeeper y el
#    servicio seed_app; no hay ningún Mongo local.


docker-compose up --build            # arranca seed_app + Kafka/Zookeeper

# 3. (opcional) Si ejecutas un Mongo local aparte (no desde este compose),
#    estará disponible en mongodb://localhost:27017

```
---

## ⚙️ Configuración

### Variables de entorno (`.env`)

```env
# URI de conexión a MongoDB
MONGO_URI=mongodb://mongo:27017

# Número de registros a generar para clientes, productos y facturas.
# Se aplica a todos si no se especifican valores separados.
SEED_N=500000

# Alternativas más finas:
# - SEED_N_CLIENTES: registros de clientes
# - SEED_N_PRODUCTOS: registros de productos
# - SEED_N_FACTURAS: registros de facturas
# úsalos para controlar cada colección por separado.
# (variaciones se basan en producto, datosfactura en las facturas)
#
# Ejemplo:
# SEED_N_CLIENTES=100000
# SEED_N_PRODUCTOS=200000
# SEED_N_FACTURAS=150000

# Registros por batch (por transacción)
SEED_BATCH=10000

# Número de workers paralelos (clientes y productos)
SEED_WORKERS=4
```

### Personalizar valores

Puedes ajustar cualquier variable de entorno en el fichero `.env` antes de
levantar los contenedores. La conexión a la base de datos está definida por
`MONGO_URI` y puede apuntar a un servidor local o a una base externa.

También puedes controlar por separado la cantidad de clientes y productos
usando `SEED_N_CLIENTES` y `SEED_N_PRODUCTOS`. Si no se establecen, ambos usan
el valor de `SEED_N`.

> ℹ️ Para cambiar a una base de datos remota simplemente edita `.env` o
> exporta `MONGO_URI` en la línea de comandos antes de hacer `docker-compose
> up`.

```bash
# ejemplo apuntando a Atlas + ajustando conteos
MONGO_URI="mongodb+srv://user:pass@cluster.mongodb.net/mydb" \
  SEED_N_CLIENTES=100000 SEED_N_PRODUCTOS=200000 \
  docker-compose up --build
```

---

## 📊 Flujo de Ejecución

```
┌─────────────────────────────────────────────────────┐
│ 1. docker-compose up                                │
│    ├─ Inicia MongoDB en puerto 27017               │
│    └─ Espera a que MongoDB esté listo (healthcheck)│
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ 2. Seed App inicia y divide el trabajo             │
│    Con SEED_N=500k y SEED_WORKERS=4:              │
│    ├─ Worker 1: clientes 0 - 125,000             │
│    ├─ Worker 2: clientes 125,000 - 250,000       │
│    ├─ Worker 3: clientes 250,000 - 375,000       │
│    └─ Worker 4: clientes 375,000 - 500,000       │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ 3. Ejecución Paralela (lo crucial)                 │
│                                                      │
│    Worker 1 ──────┐                                │
│    Worker 2 ──────┤─► Insertan batches de 10k    │
│    Worker 3 ──────┤   en MongoDB simultáneamente  │
│    Worker 4 ──────┘                                │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ 4. ✅ Finalización                                 │
│    MongoDB contiene:                               │
│    ├─ 500,000 clientes                           │
│    ├─ Productos relacionados                      │
│    └─ Variaciones vinculadas                      │
└─────────────────────────────────────────────────────┘
```

---

## 📁 Estructura del Proyecto

```
baseDR/
├── docker-compose.yml      # Orquestación de servicios
├── Dockerfile              # Imagen Node.js Alpine
├── package.json            # Dependencias
├── .env                    # Variables de entorno
├── .env.example            # Plantilla de variables
├── README.md               # Este archivo
└── src/
    ├── kafka/                        # producer/consumer Kafka
    ├── seeders/                      # scripts maestros (clientes, productos, etc.)
    │   ├── seed_all.js
    │   ├── seed_clientes_parallel.js
    │   ├── seed_productos_parallel.js
    │   ├── seed_variaciones_parallel.js
    │   ├── seed_facturas_parallel.js
    │   └── seed_datosfacturas_parallel.js
    └── workers/                      # código que ejecutan los workers
        ├── worker_seed_clientes.js
        ├── worker_seed_productos.js
        ├── worker_seed_variaciones.js
        ├── worker_seed_facturas.js
        └── worker_seed_datosfacturas.js
```

---

## 🔧 Uso

### Generar solo clientes
```bash
# usa --n o SEED_N_CLIENTES para especificar la cantidad
docker-compose run seed_app node src/seeders/seed_clientes_parallel.js --n 100000
```
### Generar facturas y datos de factura
```bash
# facturas tomará clientes ya existentes
docker-compose run seed_app node src/seeders/seed_facturas_parallel.js --n 50000
# después puedes generar los detalles:
docker-compose run seed_app node src/seeders/seed_datosfacturas_parallel.js
```
### Generar con parámetros personalizados
```bash
# cualquier maestro acepta --n, --batch, --workers y --uri
# (productos puede leer --n de SEED_N_PRODUCTOS si está en .env)

docker-compose run seed_app node src/seeders/seed_clientes_parallel.js --n 1000000 --workers 8
```

### Conectarse a la BD desde otra terminal
```bash
mongosh mongodb://localhost:27017
```

### Ver el progreso
```bash
# En otra terminal mientras corre docker-compose up
docker logs -f seed_app
```

---

## 📦 Estructura de Datos

### Clientes

```javascript
{
  "_id": ObjectId,
  "nombre": "JUAN",
  "apepat": "García",
  "apemat": "RODRÍGUEZ",
  "correo": "juan@example.com",
  "rfc": "GARJ870515XXX",
  "telefonos": [
    { "tipo": "móvil", "numero": "+52 234 567 8901" }
  ],
  "direccionEnvio": {
    "calle": "Av. Principal 123",
    "colonia": "Centro",
    "idEstado": 1,
    "idCiudad": 50,
    "idCodigoPostal": 64000
  },
  "direccionFacturacion": { /* similar */ },
  "activo": true,
  "saldoAFavor": Decimal128("1250.50"),
  "_idEmpresa": ObjectId,
  "_idSucursal": ObjectId,
  "_idUsuario": ObjectId
  // ... más campos
}
```

### Productos

```javascript
{
  "_id": ObjectId,
  "nombre": "Block de Cemento",
  "descripcion": "Block para construcción",
  "activo": true,
  "porcentajeIva": 16,
  "tieneVariaciones": true,
  "_idMoneda": ObjectId,
  "_idMonedaCosto": ObjectId,
  "_idEmpresa": ObjectId,
  "_idSucursal": ObjectId,
  "_idUsuario": ObjectId,
  "_idAccesoUsuario": ObjectId
}
```

### Facturas

```javascript
{
  "_id": ObjectId,
  "_idCliente": ObjectId,
  "fecha": ISODate,
  "subtotal": Number,
  "descuento": Number,
  "iva": Number,
  "total": Number,
  "observaciones": String,
  "_idSucursal": ObjectId,
  "_idEmpresa": ObjectId,
  "_idUsuario": ObjectId,
  "id": Number,
  "serie": String,
  "folio": Number,
  "uuid": String,
  "version": "3.3",
  "activo": true
}
```

### DatosFactura (líneas)

```javascript
{
  "_id": ObjectId,
  "_idFactura": ObjectId,
  "claveProdServ": ObjectId,
  "claveUnidad": ObjectId,
  "producto": String,
  "detalle": String,
  "cantidad_producto": Number,
  "precio_unitario": String,
  "precio_total": String,
  "iva_total": Number,
  "descuento": Number,
  "id": Number,
  "_idEmpresa": ObjectId
}
```

### Variaciones

```javascript
{
  "_id": ObjectId,
  "_idProducto": ObjectId,
  "nombre": "Block de Cemento",
  "precios": [
    {
      "_id": ObjectId,
      "precio": 150.00,
      "_idListaPrecios": ObjectId,
      "activo": true
    }
  ],
  "tieneColores": false,
  "colores": [],
  "imagenes": [],
  "_idEmpresa": ObjectId,      
  "_idSucursal": ObjectId,     
  "_idUsuario": ObjectId,      
  "_idAccesoUsuario": ObjectId 
}
```

### Facturas
```javascript
{
  "_id": ObjectId,
  "_idCliente": ObjectId,
  "fecha": ISODate,
  "subtotal": Number,
  "descuento": Number,
  "iva": Number,
  "total": Number,
  "observaciones": String,
  "_idSucursal": ObjectId,
  "_idEmpresa": ObjectId,
  "_idUsuario": ObjectId,
  "id": Number,
  "serie": String,
  "folio": Number,
  "uuid": String,
  "version": "3.3",
  "activo": true
}
```

### DatosFactura (líneas de factura)

```javascript
{
  "_id": ObjectId,
  "_idFactura": ObjectId,
  "claveProdServ": ObjectId,
  "claveUnidad": ObjectId,
  "producto": String,
  "detalle": String,
  "cantidad_producto": Number,
  "precio_unitario": String,
  "precio_total": String,
  "iva_total": Number,
  "descuento": Number,
  "id": Number,
  "_idEmpresa": ObjectId
}
```

### Coherencia de Referencias

✅ **Campos compartidos** (mismo valor en múltiples documentos para integridad referencial):
- Productos: `_idMoneda` = `_idMonedaCosto`
- Productos: `_idAccesoUsuario` = `_idUsuario`
- Variaciones: Heredan `_idEmpresa`, `_idSucursal`, `_idUsuario`, `_idAccesoUsuario` del producto

---

## ⚡ Rendimiento

### Benchmark (con SEED_N=500,000)

| Workers | Tiempo approx. | Velocidad |
|---------|---|---|
| 1 worker | 45 min | Baseline |
| 2 workers | 23 min | 2x más rápido |
| 4 workers | 12 min | 4x más rápido |
| 8 workers | 8 min | 5.6x más rápido |

> Nota: Depende del hardware y la carga del sistema

### Optimizaciones implementadas

- ✅ Batch inserts (10k registros por transacción)
- ✅ Worker threads paralelos
- ✅ Generación con Faker optimizada
- ✅ Conexión compartida a MongoDB

---

## 🐛 Troubleshooting

### MongoDB no conecta
```bash
# Verificar que MongoDB está corriendo
docker-compose logs mongo

# Reiniciar
docker-compose down
docker-compose up --build
```

### Variables de entorno no aplican
```bash
# Asegúrate de que .env existe y tiene formato correcto
cat .env

# Si no existe, copia desde el ejemplo
cp .env.example .env
```

### Logs no se ven
```bash
# Ver logs en tiempo real
docker-compose logs -f seed_app

# Ver últimas 100 líneas
docker-compose logs seed_app --tail 100
```

### Reiniciar BD (borrar datos)
```bash
# Elimina volúmenes (BORRA DATOS)
docker-compose down -v

# Reinicia con BD limpia
docker-compose up --build
```

---

## Próximas mejoras

- [ ] Agregar seed para productos y variaciones en paralelo
- [ ] Script de validación de integridad referencial
- [ ] Dashboard de progreso
- [ ] Soporte para múltiples bases de datos
- [ ] CI/CD integrado

---

## Licencia

ISC

---

## 👤 Autor

Proyecto de seeding para testeo

---

## Preguntas frecuentes

**P: ¿Puedo cambiar SEED_N durante la ejecución?**
R: No, debes parar el contenedor y reiniciar con nuevos valores.

**P: ¿Los datos se pierden si reinicio?**
R: No, Docker Compose usa volúmenes persistentes. Los datos se mantienen. Usa `docker-compose down -v` para borrar.

**P: ¿Funciona en Windows/Mac?**
R: Sí, Docker Compose es multiplataforma. Asegúrate de tener Docker Desktop instalado.

**P: ¿Puedo usar esto en producción?**
R: No, es solo para pruebas y desarrollo. El seeding con Faker no genera datos reales.
