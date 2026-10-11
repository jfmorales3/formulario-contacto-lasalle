const os = require('node:os');
const path = require('node:path');

process.loadEnvFile(path.join(__dirname, '..', 'config', 'production.env'));

process.env.DATA_FILE = path.join(os.tmpdir(), 'lasalle', 'contactos.json');

const { loadConfig } = require('../src/config');
const { createApp } = require('../src/app');

module.exports = createApp(loadConfig());
