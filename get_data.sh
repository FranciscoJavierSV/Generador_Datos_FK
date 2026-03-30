#!/bin/bash

# SCRIPT: Obtener datos del consumer y mostrar resumen

CONSUMER_URL="http://localhost:9464"

echo "=== Datos del Consumer Kafka ==="
echo ""

# Obtener informacion del servidor
echo "-- Status del Consumer --"
curl -s "${CONSUMER_URL}/" | jq '.' || echo "Consumer no disponible"

echo ""
echo "-- Estadisticas --"
curl -s "${CONSUMER_URL}/stats" | jq '.' || echo "Stats no disponibles"

echo ""
echo "-- Archivos Disponibles --"
curl -s "${CONSUMER_URL}/files" | jq '.' || echo "Archivos no disponibles"

echo ""
echo "-- Primeros 5 Mensajes --"
curl -s "${CONSUMER_URL}/data" | jq '.[0:5]' || echo "Datos no disponibles"

echo ""
echo "=== Nota ==="
echo "Endpoints disponibles:"
echo "  curl http://localhost:9464/             (informacion general)"
echo "  curl http://localhost:9464/stats        (estadisticas)"
echo "  curl http://localhost:9464/data         (todos los datos)"
echo "  curl http://localhost:9464/metrics      (metricas prometheus)"
echo "  curl http://localhost:9464/files        (archivos disponibles)"
