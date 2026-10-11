const { loadConfig } = require('./config');
const { createApp } = require('./app');

const config = loadConfig();
const app = createApp(config);
const host = config.env === 'production' ? '0.0.0.0' : '127.0.0.1';

app.listen(config.port, host, () => {
  console.log(`Formulario La Salle | ambiente=${config.env} | http://${host}:${config.port}`);
  app.locals.log.debug('Configuración cargada', { ...config, adminToken: config.adminToken ? '***' : '(vacío)' });
});
