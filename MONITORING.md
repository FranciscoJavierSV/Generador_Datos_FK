# Monitorización con Prometheus y Grafana

Este proyecto puede generar métricas de throughput, latencia y errores desde
los propios productores/consumidores Kafka. Para obtener además información
de uso de CPU/RAM es necesario un sistema de métricas como Prometheus (y
opcionalmente un dashboard con Grafana).

A continuación se describe cómo habilitarlo y qué archivos necesitas.

---

## 1. Añadir `prom-client` a tus scripts

Instala la dependencia dentro de la imagen o contenedor donde
quiera exponer las métricas (el Dockerfile ya puede incluirla). Si estás
haciendo pruebas manuales fuera de un contenedor puedes ejecutar:

```bash
npm install prom-client
```
Ya hemos modificado `src/kafka/consumer.js` para incluir un pequeño servidor
HTTP que expone métricas en `/metrics`. El comportamiento se activa siempre
que la variable `METRICS_PORT` esté definida (por defecto 9464). El
producer puede seguir el mismo patrón si quieres métricas de envío.

```js
// fragmento de consumer.js (instalado automáticamente en el proyecto)
const client = require('prom-client');
const http = require('http');

const METRICS_PORT = process.env.METRICS_PORT || 9464;
const registry = new client.Registry();
client.collectDefaultMetrics({ register: registry });
// ... configura counters/histograms ...

if (METRICS_PORT) {
  http.createServer(async (req, res) => {
    if (req.url === '/metrics') {
      res.setHeader('Content-Type', registry.contentType);
      res.end(await registry.metrics());
    } else {
      res.statusCode = 404;
      res.end();
    }
  }).listen(METRICS_PORT);
  console.log(`Prometheus metrics exposed on http://localhost:${METRICS_PORT}/metrics`);
}
```

Los contadores expuestos son:

- `consumer_messages_total` – número de mensajes recibidos
- `consumer_errors_total` – errores de procesamiento
- `consumer_latency_ms` – histograma de latencias (p50/p95/p99 calculable)
- además `prom-client` expone métricas de proceso (CPU, memoria, loops de
  eventos, etc.) automáticamente.

Puedes aplicar una lógica parecida en `producer.js` si quieres observar el
lado de envío.

---

## 2. Configurar Docker Compose

Agrega los contenedores de Prometheus y Grafana al `docker-compose.kafka.yml`
(o al compose principal) con una configuración mínima. Por ejemplo:

```yaml
version: '3.8'
services:
  zookeeper:
    image: bitnami/zookeeper:3.8
    environment:
      - ALLOW_ANONYMOUS_LOGIN=yes
    ports:
      - '2181:2181'

  kafka:
    image: bitnami/kafka:3.5
    environment:
      - KAFKA_BROKER_ID=1
      - KAFKA_ZOOKEEPER_CONNECT=zookeeper:2181
      - KAFKA_LISTENERS=PLAINTEXT://:9092
      - KAFKA_ADVERTISED_LISTENERS=PLAINTEXT://localhost:9092
      - KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR=1
    ports:
      - '9092:9092'
    depends_on:
      - zookeeper

  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml:ro
    ports:
      - '9090:9090'
    depends_on:
      - kafka
      - consumer

  grafana:
    image: grafana/grafana:latest
    ports:
      - '3000:3000'
    depends_on:
      - prometheus

  consumer:
    build: .
    command: node src/kafka/consumer.js
    environment:
      - KAFKA_BROKERS=localhost:9092
      - KAFKA_TOPIC=productos
      - MONGO_URI=${MONGO_URI}
      - METRICS_PORT=9464
    ports:
      - '9464:9464'
    depends_on:
      - kafka

# puedes añadir también un servicio producer si lo deseas
```

También necesitarás un fichero `prometheus.yml` junto a `docker-compose`:

```yaml
global:
  scrape_interval: 5s

scrape_configs:
  - job_name: 'node-app'
    static_configs:
      - targets: ['consumer:9464']
  - job_name: 'kafka'
    static_configs:
      - targets: ['kafka:9092']
```

En este ejemplo Prometheus recogerá las métricas expuestas por el consumer
(en el puerto 9464) y, si quieres, también puede scrapear métricas internas
de Kafka si expones `JMX` u otro exporter.

---

## 3. Visualizar con Grafana

Arranca los contenedores:

```bash
docker-compose -f docker-compose.kafka.yml up --build
```

Accede a Grafana en http://localhost:3000 (usuario/clave por defecto
`admin/admin`).

Crea un dashboard rápido con las métricas del consumer, p.ej.:

- `consumer_messages_total` / `rate(consumer_messages_total[1m])` →
  throughput
- `histogram_quantile(0.95, sum(rate(consumer_latency_ms_bucket[5m])) by (le))`
  → latencia p95
- `process_cpu_user_seconds_total` y `process_resident_memory_bytes` → uso
  de CPU/RAM
- `consumer_errors_total` → errores

Hay plantillas públicas de dashboards Node.js que puedes importar para
arrancar rápidamente.

---

## 4. Uso en GitHub Actions

El workflow de CI no necesita modificaciones aparte de exponer los puertos
locales. Si deseas que Actions capture las métricas como artefacto, añade
un paso que `curl http://localhost:9464/metrics > metrics.txt` y suba
`metrics.txt` como artefacto.

También recuerda destruir los contenedores al final del job:

```yaml
- name: Tear down Kafka stack
  run: docker-compose -f docker-compose.kafka.yml down
```

---

Con esto tendrás un entorno reproducible con monitorización completa de
tu pipeline Kafka + MongoDB; puedes extraer este documento y usarlo fuera
del repositorio como guía independiente.
