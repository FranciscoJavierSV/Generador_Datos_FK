# LISTA DE CAMBIOS

## REFACTOR MARZO 2026 - Modernización de Infraestructura Kafka

Modernización completa de la infraestructura del proyecto de ingesta de datos a MongoDB mediante Kafka, con enfoque en performance, persistencia y métricas.

---

## 1. Modernizar Kafka a KRaft (sin Zookeeper)

**Archivo:** `docker-compose.yml`

**Cambio:**
Migración de Kafka con Zookeeper a arquitectura KRaft moderna (Kafka 7.5.0)

```yaml
# ANTES
services:
  zookeeper:
    image: confluentinc/cp-zookeeper:latest
  kafka:
    image: confluentinc/cp-kafka:latest
    depends_on:
      - zookeeper

# AHORA
services:
  kafka:
    image: confluentinc/cp-kafka:7.5.0
    environment:
      KAFKA_NODE_ID: 1
      KAFKA_KRAFT_MODE: 'true'
      KAFKA_PROCESS_ROLES: 'broker,controller'
```

**Beneficios:**
- Reducción de servicios (Zookeeper eliminado)
- Menor consumo de recursos
- Configuración más simple
- Kafka 7.5.0 (versión moderna)

---

## 2. Agregar persistencia a Kafka

**Archivo:** `docker-compose.yml`

**Volumen:**
```yaml
volumes:
  kafka_data:
    driver: local

services:
  kafka:
    volumes:
      - kafka_data:/var/lib/kafka/data
```

**Resultado:**
- Datos de Kafka persisten entre reinicio de contenedores
- Sin pérdida de mensajes

---

## 3. Reorganizar comentarios en código por bloques funcionales

**Cambio de estructura:**

```javascript
// ANTES: comentarios sin organización
// linea comentada
// otra linea comentada
const valor = funcion();

// AHORA: bloques por responsabilidad
// VALIDACION: Verificar parámetros
const SEED_N = process.env.SEED_N || 500000;

// CONFIGURACION: Variables globales
const BROKERS = process.env.KAFKA_BROKERS || 'localhost:9092';

// UTILIDADES: Funciones auxiliares
function validarParametro(val) { ... }
```

**Beneficio:**
- Código más legible y organizado
- Fácil navegación por responsabilidades

---

## 4. Limpiar y actualizar .env

**Variables:**
```
MONGO_URI=                          # Usuario proporciona conexión
SEED_N=500000                       # Registros a generar
CONSUMER_BATCH_SIZE=5000            # Tamaño de lote para MongoDB
KAFKA_BROKERS=kafka:9092
KAFKA_TOPIC=productos
METRICS_PORT=9464
```

**Justificación:**
- MONGO_URI sin default (requiere configuración explícita)
- SEED_N=500000 para testing con volumen real
- CONSUMER_BATCH_SIZE define tamaño de batch para insertMany()

---

## 5. Remover servicios y documentación innecesaria

**Docker:**
- Eliminado servicio `producer` (seeders generan datos)
- Eliminado: test.sh

**Documentación:**
- ANTES_DESPUES.md, TESTING.md, RESUMEN.md (obsoletos)

**Resultado:**
- Proyecto limpio y enfocado

---

## 6. Implementar batch insertion a MongoDB con tracking

**Archivo:** `src/kafka/consumer.js` (completamente reescrito)

**Flujo de datos:**
```
Seed App (500k registros)
    ↓ vía Kafka
Topic "productos"
    ↓ consume
Consumer (acumula)
    ↓ cada 5,000 registros
insertMany() a MongoDB.baseDR.registros
    ↓ mide latencia
execution_N.json (métricas)
```

**Características:**

1. **Conexión MongoDB:**
   - MONGO_URI del .env
   - DB: `baseDR`, collection: `registros`
   - Connection pooling

2. **Batch Processing:**
   - Acumula 5,000 registros (CONSUMER_BATCH_SIZE)
   - insertMany() en una operación
   - Registra latencia de cada inserción

3. **Métricas generadas:**
   - execution_id: Numeración secuencial
   - latency_p50, p95, p99: Percentiles de latencia (ms)
   - throughput_inserts_per_sec: Documentos/segundo
   - elapsed_seconds: Tiempo total
   - error_rate: Porcentaje de fallos

4. **API REST (Puerto 9464):**
   - `GET /` - Estado general
   - `GET /stats` - Estadísticas actuales
   - `GET /metrics` - Prometheus metrics
   - `GET /files` - Archivos generados

5. **Persistencia:**
   - `/app/data/stats.json` - Última ejecución
   - `/app/data/estadísticas/execution_N.json` - Histórico permanente
   - `/app/data/stats_histórico.jsonl` - Log de todas las ejecuciones

**Ejemplo de métrica:**
```json
{
  "execution_id": 1,
  "timestamp": "2026-03-28T10:30:45.123Z",
  "received": 500000,
  "inserted": 500000,
  "errors": 0,
  "batch_size": 5000,
  "latency_p50": 42.5,
  "latency_p95": 85.3,
  "latency_p99": 125.7,
  "throughput_inserts_per_sec": 11062.8,
  "elapsed_seconds": 45.2
}
```

---

## Resumen

El refactor moderniza la infraestructura Kafka manteniendo el objetivo: **ingestar 500,000 registros en MongoDB en lotes de 5,000 documentos, midiendo latencia y throughput**.

**Cambios:**
- ✅ Kafka KRaft (sin Zookeeper)
- ✅ Persistencia de datos Kafka
- ✅ Código limpio y organizado
- ✅ Configuración clara en .env
- ✅ Consumer con batch insertion a MongoDB
- ✅ Tracking de ejecuciones con métricas

**Flujo final:**
```
Seed App → Kafka 7.5.0 KRaft → Consumer → insertMany(5k) → MongoDB ← metrics
```

---

## Próxima ejecución

1. Proporcionar MONGO_URI en .env (conexión a MongoDB)
2. Ejecutar: `docker-compose up`
3. Consultar métricas en: `http://localhost:9464/stats`
4. Resultados en: `./data/estadísticas/execution_1.json`

---

**Refactor completado: marzo 2026** ✅
