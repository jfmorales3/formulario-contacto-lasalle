const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { loadConfig } = require('../../src/config');
const { createApp } = require('../../src/app');

const config = loadConfig();
let server;
let baseUrl;
let storage;

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

const leerArchivo = () => JSON.parse(fs.readFileSync(config.dataFile, 'utf8'));
const registrosSalud = async () => (await (await fetch(`${baseUrl}/salud`)).json()).registros;

const valido = {
  nombre: 'Carlos Mendoza',
  correo: 'carlos.mendoza@lasalle.edu.co',
  asunto: 'Homologación de materias',
  mensaje: 'Solicito información sobre el proceso de homologación.',
};

test('CI-01 envío válido: ruta + validación + almacenamiento generan radicados consecutivos', async () => {
  const primero = await enviar(valido);
  const segundo = await enviar({ ...valido, nombre: 'Laura Pinzón', correo: 'laura.pinzon@lasalle.edu.co' });

  assert.equal(primero.status, 201);
  assert.equal(segundo.status, 201);
  assert.match(await primero.text(), /QA-0001/);
  assert.match(await segundo.text(), /QA-0002/);

  const archivo = leerArchivo();
  assert.equal(archivo.length, 2);
  assert.deepEqual(archivo.map((r) => r.radicado), ['QA-0001', 'QA-0002']);
  assert.equal(archivo[1].nombre, 'Laura Pinzón');
  assert.ok(archivo.every((r) => r.ambiente === 'test' && !Number.isNaN(Date.parse(r.creadoEn))));
  assert.equal(await registrosSalud(), 2);
});

test('CI-02 envío inválido: responde 422, conserva lo escrito y no toca el almacenamiento', async () => {
  const res = await enviar({ ...valido, nombre: 'Carlos <b>Mendoza</b>', correo: 'carlos@lasalle', mensaje: '' });
  const html = await res.text();

  assert.equal(res.status, 422);
  assert.match(html, /No se pudo enviar el formulario/);
  assert.match(html, /no tiene un formato válido/);
  assert.match(html, /El campo &quot;Mensaje&quot; es obligatorio/);
  assert.match(html, /value="Carlos &lt;b&gt;Mendoza&lt;\/b&gt;"/, 'el nombre se conserva escapado');
  assert.match(html, /value="carlos@lasalle"/);
  assert.deepEqual(leerArchivo(), []);
  assert.equal(await registrosSalud(), 0);
});
