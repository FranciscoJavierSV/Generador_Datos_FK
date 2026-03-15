# 🚀 GUÍA RÁPIDA DE INICIO

El proyecto genera datos coherentes en MongoDB usando Faker y Kafka en un
entorno completamente conteinerizado.

## 🐳 Uso con Docker (único compose)

1. Ir al directorio del proyecto:
   ```bash
   cd /home/javi/baseDR
   ```
2. Ajusta `.env` para que `MONGO_URI` apunte a tu clúster Atlas.
3. Construir y ejecutar:
   ```bash
   docker-compose up --build   # levanta Zookeeper, Kafka y seed_app
   ```

Nada se instala en el host; sólo necesitas Docker y Compose.

## ▶️ Ejecución adicional

- Para ejecutar el producer manualmente:
  ```bash
  docker-compose run --rm seed_app node src/kafka/producer.js
  ```
- Prometheus/Grafana y demás servicios opcionales pueden agregarse a un
  compose separado si lo deseas.

## 📊 Verificación

Conéctate a la base (Atlas) o al topic de Kafka para comprobar resultados
y métricas.

---

El resto de la documentación (`README.md`, `TESTING.md`, etc.) contiene
detalles más amplios si necesitas profundizar.
