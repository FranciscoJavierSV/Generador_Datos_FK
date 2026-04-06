# GUIA RAPIDA DE INICIO

## Levantar servicios

```bash
cd /home/javi/baseDR
docker-compose up --build
```

Servicios que inician:
- Kafka (puerto 9092)
- Consumer (puerto 9464)
- Producer (genera datos)

## Ver datos en tiempo real

```bash
curl http://localhost:9464/stats
```

O descargar todos los datos:

```bash
curl http://localhost:9464/data > datos.json
```

## Procesar datos para graficas

```bash
node scripts/data_processor.js
```

Genera:
- `data/processed/stats.json`
- `data/processed/charts.json`
- `data/processed/export.csv`

## Ver datos capturados

```bash
bash get_data.sh
```

## Ver métricas en tiempo real

- **Grafana**: http://localhost:3000 (admin/admin) - Dashboards de métricas Prometheus
- **Prometheus**: http://localhost:9090 - Métricas crudas
- **Dashboard Web**: http://localhost:8080 - Gráficas de datos procesados

## Parar servicios

```bash
docker-compose down
```

Borrar volumen de Kafka:

```bash
docker-compose down -v
```

---

Ver mas informacion en: **README.md** y **LISTA_CAMBIOS.md**
