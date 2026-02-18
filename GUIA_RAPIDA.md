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

# 2. Construir y ejecutar
docker-compose up --build

# En otra terminal, verificar progreso:
mongosh mongodb://localhost:27017
use test
db.clientes.countDocuments()
db.productos.countDocuments()
db.variaciones.countDocuments()
```

**Tiempo estimado:** 3-5 minutos

---

## 💻 Forma LOCAL: Sin Docker

```bash
# 1. Instalar dependencias
cd /home/javi/baseDR
npm install

# 2. Asegúrate que MongoDB está corriendo
# Opción A: MongoDB local
mongosh
# Opción B: MongoDB en Docker
docker run -d -p 27017:27017 mongo:8.0

# 3. Ejecutar seeding completo
npm run seed

# O por partes:
npm run seed:clientes      # 500k clientes
npm run seed:productos     # 500k productos
npm run seed:variaciones   # Variaciones dinámicas
```

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
├─ tieneVariaciones: true (60%) o false (40%)  ⭐ IMPORTANTE
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
mongosh mongodb://localhost:27017
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
# 100k clientes y productos
SEED_N=100000 docker-compose up --build

# O localmente
SEED_N=100000 SEED_WORKERS=2 npm run seed
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

1. **Local:** `npm install && npm run seed`
2. **Docker:** `docker-compose up --build`
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

# npm modules falta
npm install

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
