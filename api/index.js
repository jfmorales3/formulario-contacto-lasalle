// Punto de entrada para Vercel (ambiente de producción/demostración).
// Vercel ejecuta la app como función: no se usa app.listen ni la opción --env-file.
const os = require('node:os');
const path = require('node:path');

// Carga los valores no secretos de producción. Las variables definidas en el panel
// de Vercel (por ejemplo ADMIN_TOKEN) ya existen en process.env y tienen prioridad.
process.loadEnvFile(path.join(__dirname, '..', 'config', 'production.env'));

// En Vercel solo /tmp permite escritura; los datos son temporales (válido para demostración).
process.env.DATA_FILE = path.join(os.tmpdir(), 'lasalle', 'contactos.json');

const { loadConfig } = require('../src/config');
const { createApp } = require('../src/app');

module.exports = createApp(loadConfig());
