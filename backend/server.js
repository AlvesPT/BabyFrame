const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('../config');

const certificateRoutes = require('./routes/certificates');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(config.paths.frontend));
app.use(express.static(config.paths.public));
app.use('/output', express.static(config.paths.output));

app.use('/api/certificates', certificateRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(config.port, () => {
  console.log(`Baby Frame running on http://localhost:${config.port}`);
});
