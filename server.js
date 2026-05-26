const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data', 'nutritrack_data.json');

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

function readData() {
  if (!fs.existsSync(DATA_FILE)) {
    const empty = { profile:{}, goals:{kcal:2000,protein:150,carbs:250,fat:65,fiber:30}, history:[], today:{ foods:[], activities:[] } };
    fs.writeFileSync(DATA_FILE, JSON.stringify(empty, null, 2));
    return empty;
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

app.get('/api/data', (req, res) => res.json(readData()));

app.post('/api/data', (req, res) => {
  writeData(req.body);
  res.json({ ok: true });
});

app.get('/api/export/json', (req, res) => {
  res.setHeader('Content-Disposition', 'attachment; filename="nutritrack_backup.json"');
  res.json(readData());
});

app.get('/api/export/csv', (req, res) => {
  const { history } = readData();
  const headers = ['Fecha','Calorias_kcal','Objetivo_kcal','Proteina_g','Objetivo_proteina_g','Carbos_g','Objetivo_carbos_g','Grasas_g','Objetivo_grasas_g','Fibra_g','Objetivo_fibra_g','Calorias_quemadas','Num_alimentos','Num_actividades'];
  const rows = history.map(e => [
    e.dateISO||'', Math.round(e.totals.kcal||0), e.goals?.kcal||'',
    Math.round(e.totals.p||0), e.goals?.protein||'',
    Math.round(e.totals.c||0), e.goals?.carbs||'',
    Math.round(e.totals.f||0), e.goals?.fat||'',
    Math.round(e.totals.fi||0), e.goals?.fiber||'',
    e.caloriesBurned||0, e.foods?.length||0, e.activities?.length||0
  ].join(','));
  res.setHeader('Content-Disposition', 'attachment; filename="nutritrack_historial.csv"');
  res.setHeader('Content-Type', 'text/csv');
  res.send([headers.join(','), ...rows].join('\n'));
});

app.listen(PORT, () => {
  console.log('\n✅  NutriTrack Pro corriendo en http://localhost:' + PORT);
  console.log('📁  Data en: ' + DATA_FILE + '\n');
});