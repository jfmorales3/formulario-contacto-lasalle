const { loadConfig } = require('../src/config');
const { createStorage } = require('../src/storage');

const config = loadConfig();
if (config.env !== 'development') {
  console.error(`El seed solo se permite en desarrollo (ambiente actual: ${config.env}).`);
  process.exit(1);
}

const storage = createStorage(config.dataFile, config.recordPrefix);
const samples = [
  { nombre: '[DEV] Ana Desarrollo', correo: 'ana.dev@ejemplo.test', asunto: '[DEV] Consulta de horarios', mensaje: 'Registro ficticio para desarrollo.' },
  { nombre: '[DEV] Carlos Local', correo: 'carlos.dev@ejemplo.test', asunto: '[DEV] Certificado de notas', mensaje: 'Registro ficticio para desarrollo.' },
];
for (const s of samples) {
  const r = storage.save(s, config.env);
  console.log(`Creado ${r.radicado} en ${storage.filePath}`);
}
