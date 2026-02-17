# 📋 Cambios Realizados - Seeding Database

## Resumen de Mejoras

Se han realizado cambios estructurales para asegurar que la génération de datos sea coherente con un entorno real, basándose en los JSON de ejemplo proporcionados.

## ✅ Cambios Implementados

### 1. **worker_seed_clientes.js**
- ✍️ Actualizado para usar referencias constantes y coherentes
- Sucursales, empresas, y listas de precios ficticias pero reales
- RFC generado coherentemente basado en nombre y apellidos
- Todas las referencias comparten las mismas empresas y sucursales

**Estructura de Referencia:**
```
5 Sucursales x 2 Empresas x 3 Listas de Precios
```

### 2. **worker_seed_productos.js**
- ✍️ Productos con 500k registros
- Campo `tieneVariaciones` aleatorio (60% true, 40% false)
- Referencias compartidas de:
  - Monedas (constantes)
  - Unidades SAT (constantes)
  - Empresas y Sucursales (consistentes)
- Mismo usuario para todos los productos (coherencia)
- Incluye precios y costos realistas

### 3. **worker_seed_variaciones.js** - 🔄 CAMBIO PRINCIPAL
- ✍️ NUEVO FLUJO: Lee todos los productos con `tieneVariaciones: true`
- Por cada producto, genera 1-10 variaciones aleatorias
- Nombres coherentes: "Nombre Producto - Talla/Color/Modelo"
- Hereda TODOS los datos del producto (empresa, sucursal, usuario, etc.)
- **Resultado:** 500k usuarios + 500k productos + N variaciones (según tieneVariaciones)

### 4. **seed_clientes_parallel.js**
- Actualizado para usar SEED_N (500000 por defecto)
- Logs mejorados

### 5. **seed_productos_parallel.js**
- Actualizado para usar SEED_N (500000 por defecto)
- Logs mejorados

### 6. **seed_variaciones_parallel.js**
- Simplificado: no usa workers paralelos
- Lee productos existentes en BD
- Genera variaciones dinámicamente

### 7. **seed_all.js** - 🆕 NUEVO
- Script maestro que orquesta la ejecución en orden:
  1. Clientes (500k)
  2. Productos (500k)
  3. Variaciones (dinámicas según tieneVariaciones)
- Logs detallados de progreso
- Manejo de errores

### 8. **Dockerfile**
- Cambió el CMD para ejecutar `seed_all.js` en lugar de solo clientes

### 9. **package.json**
- Removido `"type": "module"` (conflicto con CommonJS)
- Agregados scripts npm:
  - `npm run seed` - Ejecuta completo
  - `npm run seed:clientes` - Solo clientes
  - `npm run seed:productos` - Solo productos
  - `npm run seed:variaciones` - Solo variaciones

## 🔄 Flujo de Ejecución Actualizado

```
docker-compose up --build
    ↓
MongoDB inicia y espera healthcheck
    ↓
seed_all.js inicia
    ├─ seed_clientes_parallel.js (500k)
    │  └─ 4 workers generan clientes en paralelo
    ├─ seed_productos_parallel.js (500k)
    │  └─ 4 workers generan productos en paralelo
    └─ seed_variaciones_parallel.js
       └─ Lee productos, genera variaciones dinámicamente
```

## 📊 Estructura de Datos - Coherencia

### Clientes
- 500,000 registros con:
  - RFC: Generado a partir de nombre + apellidos
  - Sucursal: Del pool de 5 sucursales constantes
  - Empresa: Del pool de 2 empresas constantes
  - Lista de Precios: Del pool de 3 listas constantes

### Productos
- 500,000 registros con:
  - tieneVariaciones: true (60%) o false (40%)
  - Moneda: Consistente (_idMoneda === _idMonedaCosto)
  - Usuario: Mismo para todos (coherencia referencial)
  - Precios y costos realistas

### Variaciones
- Generadas dinámicamente solo de productos con tieneVariaciones=true
- Nombres coherentes: producto + variante (color/talla/modelo)
- Heredan todas las referencias del producto
- 1-10 variaciones por producto

## 🧪 Pruebas del Proyecto

```bash
# Construcción local sin Docker
npm install
MONGO_URI=mongodb://localhost:27017 npm run seed

# Construcción con Docker
docker-compose up --build

# Solo clientes (500k)
docker-compose run seed_app node src/seed_clientes_parallel.js

# Conectarse a BD desde otra terminal
mongosh mongodb://localhost:27017

# Ver colecciones
use test
db.clientes.countDocuments()
db.productos.countDocuments()
db.variaciones.countDocuments()

# Ver ejemplo
db.clientes.findOne()
db.productos.findOne()
db.variaciones.findOne()
```

## 📈 Rendimiento Esperado

Con las variables por defecto:
- **Clientes:** ~30-60 segundos (4 workers)
- **Productos:** ~30-60 segundos (4 workers)
- **Variaciones:** Variable (depende de tieneVariaciones)
- **Total:** 2-5 minutos aproximadamente

## ⚠️ Notas Importantes

1. **Coherencia Referencial:** Todas las referencias (empresas, sucursales, monedas) son constantes
2. **tieneVariaciones:** Define si un producto tiene variaciones (decisión aleatoria)
3. **Nombres:** Las variaciones heredan el nombre del producto + variante
4. **Sin Duplicatas de Variaciones:** Si ejecutas 2 veces, las variaciones se crearan de nuevo
5. **Limpieza:** Si necesitas limpiar, usa:
   ```bash
   mongosh mongodb://localhost:27017
   use test
   db.clientes.deleteMany({})
   db.productos.deleteMany({})
   db.variaciones.deleteMany({})
   ```
