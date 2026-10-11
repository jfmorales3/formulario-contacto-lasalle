const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { loadConfig } = require('../src/config');
const { createApp } = require('../src/app');

let server;
let baseUrl;
let storage;
const config = loadConfig();

before(async () => {
  assert.equal(config.env, 'test', 'Las pruebas deben correr con NODE_ENV=test');
  const app = createApp(config);
  storage = app.locals.storage;
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', resolve);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(() => server.close());
beforeEach(() => storage.clear());

const enviar = (campos) =>
  fetch(`${baseUrl}/contacto`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(campos),
  });

const valido = {
  nombre: 'QA Estudiante Prueba',
  correo: 'qa.estudiante@lasalle.edu.co',
  asunto: 'QA - Solicitud de certificado',
  mensaje: 'Mensaje generado por la prueba automatizada CP-01.',
};

test('CP-01 envío correcto del formulario: guarda el registro y muestra confirmación', async () => {
  const res = await enviar(valido);
  const html = await res.text();
  assert.equal(res.status, 201);
  assert.equal(storage.count(), 1);
  assert.equal(storage.list()[0].ambiente, 'test');
  assert.match(html, /Su mensaje fue recibido correctamente/);
  assert.match(html, /QA-0001/);
});

test('CP-02 campo obligatorio vacío: rechaza el envío y no guarda nada', async () => {
  const res = await enviar({ ...valido, asunto: '   ' });
  const html = await res.text();
  assert.equal(res.status, 422);
  assert.match(html, /El campo &quot;Asunto&quot; es obligatorio/);
  assert.equal(storage.count(), 0);
});

test('CP-03 correo electrónico inválido: rechaza el envío y no guarda nada', async () => {
  const res = await enviar({ ...valido, correo: 'estudiante@lasalle' });
  const html = await res.text();
  assert.equal(res.status, 422);
  assert.match(html, /no tiene un formato válido/);
  assert.equal(storage.count(), 0);
});

test('Configuración: producción nunca muestra el panel de depuración', () => {
  const prod = loadConfig({ NODE_ENV: 'production', SHOW_DEBUG_PANEL: 'true' });
  assert.equal(prod.showDebugPanel, false);
  assert.notEqual(prod.dataFile, config.dataFile);
});

test('Salud: /salud informa el ambiente de pruebas y el número de registros', async () => {
  const res = await fetch(`${baseUrl}/salud`);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { estado: 'ok', ambiente: 'test', registros: 0 });
});
