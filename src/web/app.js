const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.WEB_PORT || 8080;
const DATA_DIR = process.env.DATA_DIR || './data';

app.use(express.static('public'));

// Endpoint para obtener charts.json
app.get('/api/charts', (req, res) => {
  const chartsFile = path.join(DATA_DIR, 'processed', 'charts.json');
  if (fs.existsSync(chartsFile)) {
    res.json(JSON.parse(fs.readFileSync(chartsFile, 'utf-8')));
  } else {
    res.status(404).json({ error: 'Charts not found' });
  }
});

// Endpoint para obtener stats.json
app.get('/api/stats', (req, res) => {
  const statsFile = path.join(DATA_DIR, 'stats.json');
  if (fs.existsSync(statsFile)) {
    res.json(JSON.parse(fs.readFileSync(statsFile, 'utf-8')));
  } else {
    res.status(404).json({ error: 'Stats not found' });
  }
});

app.listen(PORT, () => {
  console.log(`Web app listening on port ${PORT}`);
});