# Versión 2

Este repositorio ha sido actualizado para soportar un flujo basado en Kafka.
Los cambios principales de esta versión son:

- Migración de *workers* a **Kafka Producers** que publican datos falsos
  generados con Faker en un topic en lugar de insertar directamente en MongoDB.
- Añadido un **Kafka Consumer** en Node.js que lee los mensajes y los
  persiste en MongoDB Atlas (Free Tier).
- Se introduce un entorno local de desarrollo con **Docker Compose** que
  levanta Kafka y Zookeeper.
- Métricas básicas de rendimiento (throughput, latencia, tasa de errores)
  incorporadas tanto en producer como en consumer.
- Documentación actualizada para eliminar instrucciones de MongoDB local y
  centrar las pruebas en la base en la nube.
- Archivos nuevos y modificados:
  - `docker-compose.kafka.yml`
  - `src/kafka/producer.js`
  - `src/kafka/consumer.js`
  - Ajustes en `GUIA_RAPIDA.md` y `TESTING.md`.

Esta es la segunda iteración importante del proyecto; la versión anterior
se basaba en insert directo a base local y no incluía el pipeline de Kafka.
