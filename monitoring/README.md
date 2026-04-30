# Monitoring - Prometheus + Grafana

Visualización de métricas en tiempo real del sistema de data ingestion y API comparison.

## Estructura

```
monitoring/
├── docker-compose.yml
├── prometheus.yml
└── README.md
```

## Uso

### Inicia servicios

```bash
cd monitoring
docker-compose up --build
```

### Acceso

- **Prometheus**: http://localhost:9090
  - Scrape targets: `/targets`
  - Métricas disponibles: `/graph`
  
- **Grafana**: http://localhost:3000
  - Usuario: `admin`
  - Contraseña: `admin`

## Datos que monitorea

### Consumer (Data Ingestion)
- `consumer_messages_total`: Mensajes de Kafka
- `consumer_inserts_total`: Inserciones en MongoDB
- `consumer_batch_latency_ms`: Latencia de batches
- `consumer_errors_total`: Errores totales

### API Comparison
- `api_rest_inserts_total`: Inserciones REST
- `api_graphql_inserts_total`: Inserciones GraphQL
- `api_rest_latency_ms`: Latencia REST
- `api_graphql_latency_ms`: Latencia GraphQL
- `api_rest_errors_total`: Errores REST
- `api_graphql_errors_total`: Errores GraphQL

## Configuración Prometheus

El archivo `prometheus.yml` está configurado para scrape:

```yaml
scrape_configs:
  - job_name: 'consumer'
    targets: ['localhost:9464']  # Consumer metrics
    
  - job_name: 'api-comparison'
    targets: ['localhost:4000']  # REST + GraphQL metrics
```

## Dashboards recomendados en Grafana

1. **Data Ingestion Dashboard**
   - Throughput (docs/sec)
   - Latencia P50/P95/P99
   - Error rate

2. **API Comparison Dashboard**
   - REST vs GraphQL latency
   - Inserciones por segundo
   - Error comparison
