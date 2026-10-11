const path = require('node:path');

const ENVIRONMENTS = ['development', 'test', 'production'];
const ROOT = path.resolve(__dirname, '..');

function loadConfig(env = process.env) {
  const name = env.NODE_ENV || 'development';
  if (!ENVIRONMENTS.includes(name)) {
    throw new Error(`Ambiente no soportado: "${name}". Use uno de: ${ENVIRONMENTS.join(', ')}`);
  }

  const dataFile = env.DATA_FILE || `data/${name}/contactos.json`;

  return Object.freeze({
    env: name,
    label: env.ENV_LABEL || name,
    port: Number(env.PORT) || 3000,
    logLevel: env.LOG_LEVEL || (name === 'production' ? 'error' : 'debug'),
    showDebugPanel: name !== 'production' && env.SHOW_DEBUG_PANEL === 'true',
    dataFile: path.isAbsolute(dataFile) ? dataFile : path.join(ROOT, dataFile),
    recordPrefix: env.RECORD_PREFIX || name.slice(0, 3).toUpperCase(),
    adminToken: env.ADMIN_TOKEN || '',
  });
}

module.exports = { loadConfig, ENVIRONMENTS };
