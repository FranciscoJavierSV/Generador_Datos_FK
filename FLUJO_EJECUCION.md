FLUJO DE EJECUCION DEL PROYECTO

FASE 1: INICIACION (docker-compose up --build)

┌─────────────────────────────────────────────────────────────────┐
│ PASO 1: docker-compose up --build                              │
└─────────────────────────────────────────────────────────────────┘

Acciones:
- Construye imagen Docker desde Dockerfile
- Inicia 3 servicios: kafka, seed_app, consumer
- Crea volumen kafka_data para persistencia de Kafka

Estado:
HOST                       CONTENEDOR
/home/javi/baseDR/ ─────→  /app/ (mapeado)
./data/ ◄─────────────────  /app/data/ (volumen bidireccional)

---

FASE 2: KAFKA INICIA (segundos 1-10)

┌─────────────────────────────────────────────────────────────────┐
│ PASO 2: Servicio KAFKA en modo KRaft                           │
└─────────────────────────────────────────────────────────────────┘

¿Qué pasa?
- Kafka 7.5.0 inicia en KRAFT_MODE=true
- Se ejecuta healthcheck para verificar disponibilidad
- Puerto 9092 abierto para clientes (seed_app, consumer)

Archivos/Datos:
CONTENEDOR KAFKA:
/var/lib/kafka/data/ ◄───── Volumen docker (kafka_data)
  ├── logs/
  ├── __cluster_metadata-0/
  └── [datos internos de Kafka]

HOST:
~(.docker/volumes/kafka_data/_data/) ← datos persistentes reales

Endpoint disponible:
localhost:9092 (conexion para producers/consumers)

Log de confirmacion:
✓ kafka broker activo
✓ puerto 9092 escuchando
✓ topic "productos" listo para recibir datos

---

FASE 3: SEED_APP GENERA DATOS (segundos 10-XX, depende de SEED_N)

┌─────────────────────────────────────────────────────────────────┐
│ PASO 3: seed_app envía datos a Kafka                           │
└─────────────────────────────────────────────────────────────────┘

¿Qué pasa?
- Inicia seed_all.js (orquestador maestro)
- Lee SEED_N de .env (ej: 100)
- Crea N workers paralelos
- Cada worker genera datos con Faker
- Datos se envían a Kafka topic "productos"

Flujo de datos:
Faker.js ──→ Worker threads ──→ Kafka producer ──→ Kafka broker (localhost:9092)
(genera)    (4 en paralelo)     (serializa JSON)    (almacena en memory + disk)

Logs esperados:
[seed_app] Iniciando seeding completo...
[seed_app] Configuracion:
[seed_app]   - Total: 100 registros
[seed_app]   - Batch: 10000
[seed_app]   - Workers: 4
[seed_app] Ejecutando: seed_clientes_parallel.js...
[seed_app] Ejecutando: seed_productos_parallel.js...
[seed_app] ... otros seeders ...

Datos EN KAFKA (en memoria):
Topic: "productos"
Partition: 0
Messages: [
  { "nombre": "Producto A", "precio": 100, "tieneVariaciones": true, ... },
  { "nombre": "Producto B", "precio": 200, "tieneVariaciones": false, ... },
  { "nombre": "Producto C", "precio": 150, "tieneVariaciones": true, ... },
  // ... 100 mensajes total
]

Duracion esperada:
- SEED_N=100: ~10-30 segundos
- SEED_N=1000: ~30 segundos a 1 minuto
- SEED_N=10000: ~2-5 minutos
- SEED_N=100000: ~20-60 minutos

---

FASE 4: CONSUMER LEE Y ALMACENA (inicia en paralelo a seed_app)

┌─────────────────────────────────────────────────────────────────┐
│ PASO 4: consumer.js consume mensajes y guarda localmente       │
└─────────────────────────────────────────────────────────────────┘

¿Qué pasa?
- Consumer se conecta a Kafka
- Se suscribe al topic "productos"
- Lee cada mensaje que produce seed_app
- Almacena en archivos locales
- Expone API REST en puerto 9464

Conexion:
Consumer ──→ Kafka broker (localhost:9092) ──→ Lee topic "productos"
            (KafkaJS client)

Almacenamiento LOCAL (DENTRO DEL CONTENEDOR):

/app/data/
├── messages.jsonl       (cada mensaje en una linea)
├── stats.json          (estadisticas actuales, se actualiza cada 5s)
├── stats_histórico.jsonl (log de todas las ejecuciones)
├── estadísticas/
│   ├── execution_1.json
│   ├── execution_2.json
│   ├── execution_3.json
│   └── ...
└── processed/ (generado manualmente con data_processor.js)
    ├── stats.json
    ├── charts.json
    └── export.csv

Ejemplo de messages.jsonl:
{"_id":"67c2abc1...","nombre":"Producto A","precio":100.5,"tieneVariaciones":true}
{"_id":"67c2abc2...","nombre":"Producto B","precio":200.0,"tieneVariaciones":false}
{"_id":"67c2abc3...","nombre":"Producto C","precio":150.75,"tieneVariaciones":true}

Ejemplo de stats.json:
{
  "timestamp": "2026-03-28T15:45:30.123Z",
  "received": 100,
  "errors": 0,
  "latency_p50": 2.5,
  "latency_p95": 8.3,
  "latency_p99": 15.2,
  "throughput_msg_sec": 250.5
}

API HTTP disponible (puerto 9464):

GET http://localhost:9464/
Respuesta: Estado del consumer, endpoints disponibles

GET http://localhost:9464/data
Respuesta: Array JSON de [{ datos capturados }]

GET http://localhost:9464/stats
Respuesta: Estadisticas de latencia y throughput

GET http://localhost:9464/files
Respuesta: Info sobre archivos guardados

GET http://localhost:9464/metrics
Respuesta: Metricas en formato Prometheus

MAPEO DE VOLUMENES (LOCAL ↔ CONTENEDOR):

HOST                          CONTENEDOR
~baseDR/data/ ◄──→ /app/data/
(montaje bidireccional)       (donde consumer guarda)

VISIBLE EN HOST:
ls ./data/
├── messages.jsonl  (accesible para lectura/procesamiento)
├── stats.json
└── processed/ (si ejecutaste data_processor.js)

---

FASE 5: ACCESO A DATOS (mientras consumer corre o despues)

OPCION A: Query via HTTP

Terminal en host:
$ curl http://localhost:9464/stats
{
  "timestamp": "2026-03-28T15:45:30.123Z",
  "received": 100,
  "errors": 0,
  "latency_p50": 2.5,
  "latency_p95": 8.3,
  "latency_p99": 15.2,
  "throughput_msg_sec": 250.5
}

OPCION B: Leer archivos locales

Terminal en host:
$ head -5 ./data/messages.jsonl
{"_id":"...","nombre":"Producto A",...}
{"_id":"...","nombre":"Producto B",...}
...

OPCION C: Script bash

Terminal en host:
$ bash get_data.sh
(muestra status, estadisticas, datos de ejemplo)

---

FASE 6: PROCESAR DATOS PARA GRAFICAS

OPCION A: Manual (despues de que consumer termino)

Terminal en host:
$ node scripts/data_processor.js

El script:
- Lee ./data/messages.jsonl
- Genera estadisticas por campo
- Crea JSON para graficas
- Exporta a CSV

Genera:
./data/processed/
├── stats.json       ← Aggregaciones por campo
├── charts.json      ← Datos para D3.js, Chart.js
└── export.csv       ← Hoja de calculo

Ejemplo charts.json:
{
  "tieneVariaciones": {
    "true": 65,
    "false": 35
  },
  "porcentajeIva": {
    "0": 20,
    "8": 30,
    "16": 50
  },
  "activo": {
    "true": 95,
    "false": 5
  }
}

---

TIMELINE DE EJECUCION (SEED_N=100)

Segundo     Evento                              Accion
─────────────────────────────────────────────────────────────────
0           docker-compose up --build          Inicia
1-5         Kafka inicia KRaft mode            Espera healthcheck
6           seed_app inicia                    Lee .env
7-8         Workers threads crean              Faker genera datos
9-15        Datos enviados a Kafka             Producer envia
1-20        Consumer conecta a Kafka           Consume empieza
1-25        Todos los 100 mensajes llegan      messages.jsonl crece
25          seed_app finaliza                  echo "Done"
25+         consumer sigue escuchando          Aguarda mas mensajes (control-c)

---

INFORMACIÓN DE ARCHIVOS

EN EL HOST (./data/):

File                  Size        Contenido
─────────────────────────────────────────────────────────────────
messages.jsonl        ~5KB @ 100  Una linea JSON por mensaje
                      ~500KB @ 100k
                      ~5MB @ 1M

stats.json            ~200B       Estadisticas actuales

processed/stats.json  ~500B       (despues de data_processor)
processed/charts.json ~1KB        Agregaciones para graficas
processed/export.csv  ~5KB        CSV para Excel

DENTRO DEL CONTENEDOR (Kafka):

/var/lib/kafka/data/
├── logs/              Logs internos de Kafka
├── __cluster_metadata-0/  Metadata
└── other_files        Topic data (persistencia)

---

COMO VERIFICAR EN CADA FASE

FASE 1 (Kafka iniciando):
$ docker-compose logs kafka | grep -i "started"

FASE 2 (seed_app genera):
$ docker-compose logs seed_app
Deberas ver: "Iniciando seeding", "Ejecutando seed_...", numeros

FASE 3 (consumer captura):
$ docker-compose logs consumer
Deberas ver: "Connected", "Consuming from", numeros de mensajes

FASE 4 (datos en host):
$ ls -lh ./data/
$ wc -l ./data/messages.jsonl
$ cat ./data/stats.json

FASE 5 (API HTTP):
$ curl http://localhost:9464/stats | jq
$ curl http://localhost:9464/data | jq 'length'

FASE 6 (procesar datos):
$ node scripts/data_processor.js
$ cat ./data/processed/charts.json | jq

---

RESUMEN DE UBICACIONES

Generacion de datos:   → Dentro del contenedor (seed_app)
Bus de mensajes:       → Kafka (contenedor, puerto 9092)
Almacenamiento:        → /app/data (contenedor) = ./data (host)
API de acceso:         → localhost:9464 (host accede a contenedor)
Procesamiento:         → Host (node scripts/data_processor.js)
Datos finales:         → ./data/processed/

---

PROXIMOS PASOS DESPUES DE dc up

1. Esperar que consumer este corriendo
2. Verificar datos: curl http://localhost:9464/stats
3. De parar: Control+C en la terminal
4. Procesar datos: node scripts/data_processor.js
5. Ver graficas: cat ./data/processed/charts.json

---
