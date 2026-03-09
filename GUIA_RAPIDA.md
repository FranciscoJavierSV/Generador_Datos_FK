# 🚀 GUÍA RÁPIDA DE INICIO

## ¿Qué cambió?

El proyecto ahora genera datos **coherentes y realistas**:
- **500k clientes** únicos con referencias válidas
- **500k productos** con el campo `tieneVariaciones` (true/false)
- **~3M variaciones** generadas SOLO de productos que tienen `tieneVariaciones=true`
- **Nombres coherentes** entre tablas (variación hereda nombre del producto)
- **Referencias compartidas** (mismas empresas, sucursales, monedas)

---

## 🐳 Forma RECOMENDADA: Docker

```bash
# 1. Ir al directorio
cd ..../baseDR

# 2. Ajusta tu `.env` para que MONGO_URI apunte a Atlas
#    por ejemplo: mongodb+srv://usuario:password@cluster0.abcd.mongodb.net/test

# 3. Construir y ejecutar
docker-compose up --build

# En otra terminal, verificar progreso (reemplaza la URI según tu Atlas):
mongosh "$MONGO_URI"
use test
db.clientes.countDocuments()
db.productos.countDocuments()
db.variaciones.countDocuments()
```
**Tiempo estimado:** 3-5 minutos

---

## 💻 Ejecución alternativa (solo contenedores)

Toda la aplicación puede correr dentro de Docker; no es necesario instalar
nada más que Docker y Docker Compose en el host. El siguiente ejemplo
arranca los servicios de Kafka/Zookeeper, consumer, Prometheus y Grafana:

```bash
# construye la imagen y levanta el stack completo
docker-compose -f docker-compose.kafka.yml up --build
```

Si únicamente quieres ejecutar el seeder original (sin Kafka) puedes usar
el compose normal:

```bash
# mongo + seed_app
docker-compose up --build
```

Para lanzar el producer puedes ejecutarlo desde un contenedor: 

```bash
# el binario `node` se toma de la imagen construida del repo
docker-compose run --rm consumer node src/kafka/producer.js
```

De esta manera no tendrás que ejecutar ningún `npm` o `node` localmente; los
comandos se producen dentro de los contenedores.

---

## 📊 Estructura de Datos Generada

### USUARIOS/CLIENTES
```
500,000 documentos
├─ Nombre, apellidos, RFC (generado coherentemente)
├─ Direcciones, teléfonos, correo
├─ Referencia a: Sucursal, Empresa, Lista de Precios
└─ Datos realistas
```

### PRODUCTOS
```
500,000 documentos
├─ Nombre del producto
├─ tieneVariaciones: true (60%) o false (40%)
├─ Precios y costos realistas
├─ Referencia a: Empresa, Sucursal, Moneda, Usuario
└─ Datos validados
```

### VARIACIONES
```
~3,000,000 documentos (dinámico)
├─ Generadas SOLO si el producto tiene tieneVariaciones=true
├─ Nombre: "ProductName - Color/Talla/Modelo"
├─ Hereda TODAS las referencias del producto
├─ 1-10 variaciones por producto
└─ Precios relacionados
```

---

## ✅ Verification Rápida

```javascript
// En mongosh
mongosh "$MONGO_URI"
use test

// Ver conteos (esperado: todos > 0)
db.clientes.countDocuments()
db.productos.countDocuments()
db.variaciones.countDocuments()

// Ver ejemplos
db.clientes.findOne()
db.productos.findOne()
db.variaciones.findOne()

// Validar coherencia
const producto = db.productos.findOne({ tieneVariaciones: true })
const variaciones = db.variaciones.find({ _idProducto: producto._id }).toArray()
console.log(`Producto: ${producto.nombre}`)
console.log(`Variaciones: ${variaciones.length}`)
variaciones.forEach(v => console.log(`  - ${v.nombre}`))
```

---

## 🔧 Personalización

### Generar MENOS datos
```bash
# 100k clientes y productos (contenedores)
SEED_N=100000 docker-compose up --build
```

### Generar MÁS workers
```bash
SEED_WORKERS=8 docker-compose up --build
```

### Limpiar base de datos
```javascript
mongosh mongodb://localhost:27017
use test
db.clientes.deleteMany({})
db.productos.deleteMany({})
db.variaciones.deleteMany({})
```

---

## 📚 Documentación COMPLETA

- **README.md** - Información general
- **RESUMEN.md** - Resumen ejecutivo de cambios
- **CAMBIOS.md** - Cambios detallados por archivo
- **ANTES_DESPUES.md** - Comparación visual
- **TESTING.md** - Guía de testing y debugging
- **GUIA_RAPIDA.md** - Este archivo

---

## 🎯 Próximos Pasos

1. **Docker:** `docker-compose up --build` (o usa stack Kafka para monitoreo)
3. **Verificar:** `mongosh mongodb://localhost:27017`
4. **Validar:** Ver conteos y ejemplos
5. **Usar datos:** Los 500k clientes y 500k productos están listos

---

## ⚡ Estadísticas

| Métrica | Valor |
|---------|-------|
| Clientes | 500,000 |
| Productos | 500,000 |
| Con variaciones | ~300,000 |
| Sin variaciones | ~200,000 |
| Total variaciones | ~3,000,000 |
| Tiempo total | 3-5 min |
| Tamaño BD | ~1.5 GB |
| Workers | 4 (paralelo) |

---

## 🆘 Problemas Comunes

```bash
# MongoDB no disponible
docker run -d -p 27017:27017 mongo:8.0

# Dependencias son gestionadas dentro de los contenedores
# reconstruye si algo falta: docker-compose build

# Sintaxis error
node -c src/seed_all.js

# Ver logs si falla
docker logs seed_app
```

---

**¡Listo! El proyecto está actualizado y listo para usar. 🎉**

Comienza con:
```bash
cd /home/javi/baseDR
docker-compose up --build
```
