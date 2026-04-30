# Data Ingestion - Kafka + Seeders + Consumer

Genera datos masivos con Faker, envía a Kafka y los inserta en MongoDB.

## Estructura

```
data-ingestion/
├── Dockerfile           # Imagen para seeders y consumer
├── docker-compose.yml   # Kafka + Consumer
├── package.json
└── src/
    ├── kafka/
    │   ├── producer.js      # Envía datos a Kafka
    │   └── consumer.js      # Lee de Kafka e inserta en MongoDB
    ├── seeders/
    │   ├── seed_all.js      # Orquestador
    │   └── seed_*_parallel.js
    └── workers/
        └── worker_*.js
```

## Uso

### 1. Inicia infraestructura (Kafka + Consumer)

```bash
cd data-ingestion
docker-compose up --build
```

Inicia:
- Kafka en puerto 9092
- Consumer en puerto 9464

### 2. Genera datos (en otro terminal)

```bash
# Desde raíz del proyecto
docker-compose run seed_app
```

O local:
```bash
cd data-ingestion
npm install
npm run seed
```

## Configuración

Variables en `../.env` (del proyecto raíz):

```bash
MONGO_URI=mongodb://...
SEED_N=100000
SEED_BATCH=5000
SEED_WORKERS=4
KAFKA_BROKERS=kafka:9092
KAFKA_TOPIC=data
KAFKA_GROUP_ID=data-collector
CONSUMER_BATCH_SIZE=5000
KAFKA_LOG_MESSAGE_MAX_BYTES=100485760
KAFKA_REPLICA_FETCH_MAX_BYTES=100485760
```

## APIs

- **Consumer**: http://localhost:9464
  - `/`: Status
  - `/stats`: Estadísticas actuales
  - `/metrics`: Prometheus metrics
  - `/files`: Archivos generados

## Flujo

```
Seeders (Worker Threads)
    ↓
Kafka Producer
    ↓
Kafka Broker (9092)
    ↓
Kafka Consumer
    ↓
Valida colecciones
    ↓
MongoDB insertMany()
```

## Métricas

- `consumer_messages_total`: Mensajes de Kafka
- `consumer_inserts_total`: Documentos en MongoDB
- `consumer_batch_latency_ms`: Latencia de batches
- `consumer_errors_total`: Errores
