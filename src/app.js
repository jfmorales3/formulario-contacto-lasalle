const path = require('node:path');
const crypto = require('node:crypto');
const express = require('express');
const { createLogger } = require('./logger');
const { createStorage } = require('./storage');
const { validateContact } = require('./validation');
const views = require('./views');

function createApp(config) {
  const app = express();
  const log = createLogger(config.logLevel, config.env);
  const storage = createStorage(config.dataFile, config.recordPrefix);

  app.disable('x-powered-by');
  app.use((req, res, next) => {
    res.set({
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'same-origin',
      'Content-Security-Policy': "default-src 'self'; style-src 'self'; script-src 'self'",
    });
    next();
  });

  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      log.debug(`${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - start} ms)`);
    });
    next();
  });

  app.use(express.static(path.join(__dirname, '..', 'public')));
  app.use(express.urlencoded({ extended: false, limit: '20kb' }));

  app.get('/', (req, res) => res.send(views.homePage(config)));

  app.get('/contacto', (req, res) => res.send(views.formPage(config)));

  app.post('/contacto', (req, res) => {
    const { valid, errors, data } = validateContact(req.body);
    if (!valid) {
      log.info('Formulario rechazado por validación', { campos: Object.keys(errors) });
      return res.status(422).send(views.formPage(config, { values: data, errors }));
    }
    const record = storage.save(data, config.env);
    log.info(`Contacto almacenado con radicado ${record.radicado}`);
    log.debug('Registro guardado', record);
    res.status(201).send(views.thanksPage(config, record));
  });

  app.get('/salud', (req, res) => {
    res.json({ estado: 'ok', ambiente: config.env, registros: storage.count() });
  });

  app.get('/admin/mensajes', (req, res) => {
    if (!config.adminToken) return res.status(404).send(views.notFoundPage(config));
    const provided = (req.get('authorization') || '').replace(/^Bearer\s+/i, '');
    const expected = Buffer.from(config.adminToken);
    const given = Buffer.from(provided);
    if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) {
      log.warn('Intento de acceso no autorizado a /admin/mensajes');
      return res.status(401).json({ error: 'No autorizado' });
    }
    res.json(storage.list());
  });

  app.use((req, res) => res.status(404).send(views.notFoundPage(config)));

  app.use((err, req, res, next) => {
    log.error('Error no controlado', { mensaje: err.message, stack: config.showDebugPanel ? err.stack : undefined });
    res.status(500).send(views.errorPage(config, err));
  });

  app.locals.storage = storage;
  app.locals.log = log;
  return app;
}

module.exports = { createApp };
