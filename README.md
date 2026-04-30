# BaseDR - Plataforma de Datos con Kafka, MongoDB y Comparación REST/GraphQL

Este repositorio ahora está organizado en servicios separados para:
- **data-ingestion/**: generación de datos, Kafka y consumer que inserta en MongoDB
- **api-comparison/**: API independiente para comparar REST vs GraphQL
- **monitoring/**: Prometheus y Grafana para métricas y dashboards

## Estructura del proyecto

```
baseDR/
├── data-ingestion/          # Kafka + seeders + consumer
├── api-comparison/          # REST + GraphQL API para pruebas
├── monitoring/              # Prometheus + Grafana
├── data/                    # Directorio de datos local montado
├── docker-compose.yml       # Orquestador principal
├── .env                     # Configuración global
├── .env.example             # Plantilla de configuración
├── README.md                # Esta documentación
└── get_data.sh              # Script de consulta rápida
```

## Uso principal

### 1. Iniciar infraestructura

```bash
cd baseDR
docker-compose up --build
```

Esto arranca:
- Kafka en `localhost:9092`
- Consumer en `localhost:9464`
- Prometheus en `localhost:9090`
- Grafana en `localhost:3000`

### 2. Generar datos manualmente

```bash
docker-compose run seed_app
```

El seeding no se inicia automáticamente. Así controlas cuándo comienzan las inserciones.

### 3. Probar la API de comparación

```bash
cd api-comparison
docker-compose up --build
```

Esto arranca un servidor independiente en `localhost:4000`.

## Qué hace cada carpeta

### `data-ingestion/`
- Genera datos con Faker usando worker threads
- Envía datos a Kafka
- Consume mensajes de Kafka y los inserta en MongoDB
- Valida que las colecciones existan antes de insertar

### `api-comparison/`
- Expone endpoints REST para inserciones
- Expone un endpoint GraphQL para mutaciones
- Permite comparar performance entre REST y GraphQL
- Contiene métricas Prometheus propias

### `monitoring/`
- Prometheus para recolectar métricas
- Grafana para visualizar dashboards
- Puede ejecutarse de forma independiente si se desea

## Configuración

Ajusta `.env` en la raíz con la conexión a MongoDB y parámetros de Kafka.

Ejemplo mínimo:

```bash
MONGO_URI=mongodb://usuario:pass@host:puerto/baseDR
SEED_N=100000
SEED_BATCH=5000
SEED_WORKERS=4
CONSUMER_BATCH_SIZE=5000
KAFKA_BROKERS=kafka:9092
KAFKA_TOPIC=data
KAFKA_GROUP_ID=data-collector
KAFKA_LOG_MESSAGE_MAX_BYTES=100485760
KAFKA_REPLICA_FETCH_MAX_BYTES=100485760
METRICS_PORT=9464
```

## Comandos útiles

```bash
# Iniciar infraestructura
cd baseDR
docker-compose up --build

# Generar datos manualmente
docker-compose run seed_app

# Iniciar API de comparación
eval "(cd api-comparison && docker-compose up --build)"

# Iniciar monitoring separado
eval "(cd monitoring && docker-compose up --build)"
```

## Métricas disponibles

### Consumer / data-ingestion
- `consumer_messages_total`
- `consumer_inserts_total`
- `consumer_batch_latency_ms`
- `consumer_errors_total`

### API Comparison
- `api_rest_inserts_total`
- `api_graphql_inserts_total`
- `api_rest_latency_ms`
- `api_graphql_latency_ms`
- `api_rest_errors_total`
- `api_graphql_errors_total`

## Estado actual

- La reestructuración de servicios está hecha.
- Los servicios están separados por carpeta.
- Se eliminaron los documentos antiguos que ya no eran necesarios.
- La documentación principal ahora describe el flujo actual y los comandos reales.

## Si quieres continuar

- Revisa `data-ingestion/README.md` para detalles del ingest workflow
- Revisa `api-comparison/README.md` para ejemplos REST/GraphQL
- Revisa `monitoring/README.md` para dashboards y métricas
