// consumer.js - KafkaJS consumer that reads from a topic and inserts into
// MongoDB Atlas. It also tracks simple throughput/latency and error rate.

const { Kafka } = require('kafkajs');
const { MongoClient } = require('mongodb');
// optional Prometheus exporter for CPU/RAM and custom metrics
const client = require('prom-client');
const http = require('http');

const BROKERS = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');
const TOPIC = process.env.KAFKA_TOPIC || 'productos';
const GROUP_ID = process.env.KAFKA_GROUP_ID || 'mongo-inserter';
const MONGO_URI = process.env.MONGO_URI; // e.g. mongodb+srv://<user>:<pw>@cluster0...

if (!MONGO_URI) {
  console.error('MONGO_URI must be defined in environment');
  process.exit(1);
}

const kafka = new Kafka({ clientId: 'faker-consumer', brokers: BROKERS });
const consumer = kafka.consumer({ groupId: GROUP_ID });

// metrics
let received = 0;
let errors = 0;
const latencies = [];
let startTime;

// Prometheus setup (if desired)
const METRICS_PORT = process.env.METRICS_PORT || 9464;
const registry = new client.Registry();
client.collectDefaultMetrics({ register: registry });
// track processed messages and errors
const msgCounter = new client.Counter({
  name: 'consumer_messages_total',
  help: 'Total number of messages received',
  registers: [registry],
});
const errCounter = new client.Counter({
  name: 'consumer_errors_total',
  help: 'Total number of processing errors',
  registers: [registry],
});
const latencyHistogram = new client.Histogram({
  name: 'consumer_latency_ms',
  help: 'Latency of message processing in ms',
  buckets: [5, 10, 50, 100, 200, 500, 1000],
  registers: [registry],
});

// if port is defined, start HTTP server
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

function recordLatency(ms) {
  latencies.push(ms);
  if (latencies.length > 100000) latencies.shift();
}

function percentile(arr, p) {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.floor((p / 100) * sorted.length);
  return sorted[idx] || 0;
}

async function logMetrics() {
  const elapsedSec = (Date.now() - startTime) / 1000;
  const errorRate = ((errors / (received || 1)) * 100).toFixed(2);
  console.log(`\n== Consumer metrics after ${elapsedSec.toFixed(1)}s ==`);
  console.log(`throughput: ${(received / elapsedSec).toFixed(1)} msg/s`);
  console.log(`errors: ${errors} (${errorRate}%); latency p50=${percentile(latencies,50)}ms p95=${percentile(latencies,95)}ms p99=${percentile(latencies,99)}ms`);
}

async function run() {
  await consumer.connect();
  await consumer.subscribe({ topic: TOPIC, fromBeginning: true });

  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db();
  const collection = db.collection('productos');

  startTime = Date.now();
  setInterval(logMetrics, 5000);

  const max = process.env.MAX_MESSAGES ? parseInt(process.env.MAX_MESSAGES, 10) : Infinity;

  await consumer.run({
    eachMessage: async ({ message }) => {
      received++;
      msgCounter.inc();
      const t0 = Date.now();
      try {
        const data = JSON.parse(message.value.toString());
        await collection.insertOne(data);
      } catch (e) {
        errors++;
      errCounter.inc();
        console.error('insert error', e.message);
      }
      const t1 = Date.now();
      recordLatency(t1 - t0);
      latencyHistogram.observe(t1 - t0);

      if (received >= max) {
        console.log(`received ${received} messages, shutting down`);
        await consumer.disconnect();
        await client.close();
        process.exit(0);
      }
    },
  });
}

run().catch(err => {
  console.error('consumer error', err);
  process.exit(1);
});
