# API Comparison - REST vs GraphQL

Servidor independiente para comparar performance de inserciones entre **REST** y **GraphQL**.

## Características

- **REST**: Endpoints POST `/rest/insert/{cliente|producto|factura}`
- **GraphQL**: Mutaciones `insertCliente`, `insertProducto`, `insertFactura`
- **Validación**: Solo inserta en colecciones existentes en MongoDB
- **Métricas**: Prometheus en `/metrics`
- **Misma BD**: Se conecta a la misma MongoDB que los seeders

## Uso

### 1. Configurar
```bash
# Copiar del root
cp ../.env .env.example

# Editar .env con tu MONGO_URI (DEBE ser la misma que baseDR principal)
```

### 2. Iniciar
```bash
# Con docker-compose (necesita MONGO_URI en .env)
docker-compose up --build

# O local
npm install
npm start
```

### 3. Pruebas REST

**Insertar cliente:**
```bash
curl -X POST http://localhost:4000/rest/insert/cliente \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Juan","email":"juan@example.com","ciudad":"Madrid"}'
```

**Insertar producto:**
```bash
curl -X POST http://localhost:4000/rest/insert/producto \
  -H "Content-Type: application/json" \
  -d '{"nombre":"Laptop","precio":999.99,"stock":5}'
```

### 4. Pruebas GraphQL

**URL:** http://localhost:4000/graphql

**Insertar cliente:**
```graphql
mutation {
  insertCliente(nombre: "María", email: "maria@example.com", ciudad: "Barcelona") {
    success
    message
    insertedId
  }
}
```

**Insertar producto:**
```graphql
mutation {
  insertProducto(nombre: "Mouse", precio: 29.99, stock: 50) {
    success
    message
    insertedId
  }
}
```

## Métricas

- `api_rest_inserts_total`: Conteo de inserciones REST
- `api_graphql_inserts_total`: Conteo de inserciones GraphQL
- `api_rest_latency_ms`: Latencia REST
- `api_graphql_latency_ms`: Latencia GraphQL
- `api_rest_errors_total`: Errores REST
- `api_graphql_errors_total`: Errores GraphQL

Ver en: http://localhost:4000/metrics

## Comparación

Para comparar, necesitas hacer las mismas inserciones en ambos endpoints y medir:

1. **Latencia**: tiempo de respuesta
2. **Throughput**: inserciones por segundo
3. **Errores**: % de fallos
4. **Payload**: tamaño de request/response

Usa Prometheus/Grafana para graficar los resultados en tiempo real desde metricas de ambos servicios.
