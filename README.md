# BaseDR - Sistema de Recoleccion de Datos con Kafka

Sistema Node.js para generar grandes volúmenes de datos de prueba, enviarios a Kafka y recopilar datos localmente en archivos para procesamiento posterior.

## Descripcion

El proyecto permite:
- Generar datos realistas con **Faker** usando **worker threads** para paralelismo
- Enviar datos a **Kafka 7.5.0 en modo KRaft** (sin Zookeeper)
- Capturar mensajes de Kafka y almacenarios en archivos locales
- Procesar datos para exportacion en multiples formatos (JSONL, JSON, CSV)
- Acceder a datos via API REST HTTP en puerto 9464

Arquitectura:
- **Producer**: Genera datos y los envia a Kafka
- **Kafka**: Bus de mensajes (KRaft mode)
- **Consumer**: Lee de Kafka y almacena en archivos locales
- **Data Processor**: Transforma datos para visualizacion


## Inicio Rapido

Requisitos: Docker & Docker Compose

```bash
cd baseDR
docker-compose up --build
```

Acceder a consumer: http://localhost:9464

Ver datos: curl http://localhost:9464/data

---

## Flujo de Datos

```
Producer (seed_app) ─── Kafka (KRaft) ─── Consumer (almacena) ─── Data Processor
       ↓                                          ↓                     ↓
  Genera datos                        /app/data (volumen)       datos/processed/
  con Faker                           - messages.jsonl
                                      - stats.json
                                      - HTTP API (puerto 9464)
```

---

## Configuracion

Variables de entorno en `.env`:

```
KAFKA_BROKERS=kafka:9092
KAFKA_TOPIC=productos
KAFKA_GROUP_ID=data-collector
DATA_DIR=/app/data
METRICS_PORT=9464
SEED_N=100
```

---

## Endpoints HTTP (Consumer)

| Endpoint | Descripcion |
|----------|------------|
| `GET /` | Estado general |
| `GET /data` | Todos los datos capturados |
| `GET /stats` | Estadisticas actuales |
| `GET /files` | Archivos disponibles |
| `GET /metrics` | Metricas Prometheus |

---

## Archivos Generados

`./data/`
- `messages.jsonl` - Datos capturados (uno por linea)
- `stats.json` - Estadisticas
- `processed/` - Datos procesados (stats, charts, CSV)

---

## Procesar Datos

```bash
node scripts/data_processor.js
```

Genera:
- `data/processed/stats.json` - Estadisticas por campo
- `data/processed/charts.json` - Datos para graficas
- `data/processed/export.csv` - Export en CSV

---

> Mas informacion en GUIA_RAPIDA.md y LISTA_CAMBIOS.md
