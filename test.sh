#!/bin/bash

# Script de prueba para validar el proyecto

echo "🔍 Validando estructura del proyecto..."
echo ""

# Verificar archivos principales
FILES=(
  "src/seed_all.js"
  "src/seed_clientes_parallel.js"
  "src/seed_productos_parallel.js"
  "src/seed_variaciones_parallel.js"
  "src/seed_facturas_parallel.js"
  "src/seed_datosfacturas_parallel.js"
  "src/worker_seed_clientes.js"
  "src/worker_seed_productos.js"
  "src/worker_seed_variaciones.js"
  "src/worker_seed_facturas.js"
  "src/worker_seed_datosfacturas.js"
  "Dockerfile"
  "docker-compose.yml"
  "package.json"
)

for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "✅ $file"
  else
    echo "❌ $file - FALTA"
  fi
done

echo ""
echo "📊 Resumen de cambios:"
echo "  • seed_all.js: Nuevo (orquestador maestro)"
echo "  • worker_seed_clientes.js: Actualizado (referencias constantes)"
echo "  • worker_seed_productos.js: Actualizado (tieneVariaciones)"
echo "  • worker_seed_variaciones.js: Completamente reescrito"
echo "  • worker_seed_facturas.js: Nuevo (genera facturas relacionados a clientes)"
echo "  • worker_seed_datosfacturas.js: Nuevo (genera líneas de factura)"
echo "  • Dockerfile: Actualizado (CMD -> seed_all.js)"
echo "  • package.json: Actualizado (scripts + sin type:module)"
echo ""

echo "🧪 Para probar localmente (todo en contenedores):"
echo "  # basta con tener Docker/Compose instalado"
echo "  docker-compose up --build"  # levanta mongo+seed_app

echo ""

echo "🐳 Para probar con Docker:"
echo "  docker-compose up --build"
echo ""

echo "📈 Base de datos resultante:"
echo "  • Clientes: 500,000"
echo "  • Productos: 500,000"
echo "  • Variaciones: N (dinámico, según tieneVariaciones)"
echo ""
