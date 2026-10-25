const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { chromium } = require('playwright');
const { loadConfig } = require('../../src/config');
const { createApp } = require('../../src/app');

const EVIDENCIAS = path.join(__dirname, '..', '..', 'pruebas', 'actividad8', 'evidencias');
const config = loadConfig();
let server;
let baseUrl;
let storage;
let browser;
let page;
let envios;

before(async () => {
  assert.equal(config.env, 'test', 'Las pruebas deben correr con NODE_ENV=test');
  const app = createApp(config);
  storage = app.locals.storage;
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', resolve);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch();
});

after(async () => {
  await browser.close();
  server.close();
});

beforeEach(async () => {
  storage.clear();
  page = await browser.newPage({ viewport: { width: 1280, height: 860 }, locale: 'es-CO' });
  envios = 0;
  page.on('request', (req) => {
    if (req.method() === 'POST' && req.url().endsWith('/contacto')) envios += 1;
  });
});

const captura = (nombre) => page.screenshot({ path: path.join(EVIDENCIAS, `${nombre}.png`), fullPage: true });

test('CF-01 el usuario diligencia y envía el formulario desde el navegador', async () => {
  await page.goto(baseUrl);
  await page.getByRole('link', { name: 'Escribir un mensaje' }).click();
  await page.getByLabel('Nombre completo').fill('María Fernanda Torres');
  await page.getByLabel('Correo electrónico').fill('mftorres@unisalle.edu.co');
  await page.getByLabel('Asunto').fill('Certificado de notas');
  await page.getByLabel('Mensaje').fill('Necesito un certificado de notas del semestre 2026-1 para una beca.');
  await captura('CF-01_1_formulario_diligenciado');
  await page.getByRole('button', { name: 'Enviar mensaje' }).click();

  await page.getByRole('status').waitFor();
  assert.match(await page.getByRole('status').innerText(), /Gracias, María Fernanda Torres/);
  assert.equal(await page.locator('.radicado').innerText(), 'QA-0001');
  assert.equal(envios, 1);
  assert.equal(storage.list()[0].correo, 'mftorres@unisalle.edu.co');
  await captura('CF-01_2_confirmacion_radicado');
});

test('CF-02 la validación del navegador bloquea envíos vacíos o con correo mal formado', async () => {
  await page.goto(`${baseUrl}/contacto`);
  await page.getByRole('button', { name: 'Enviar mensaje' }).click();

  const errores = await page.locator('.field.has-error').count();
  assert.equal(errores, 4, 'los cuatro campos deben marcarse como obligatorios');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'nombre', 'el foco vuelve al primer campo inválido');
  await captura('CF-02_1_campos_vacios');

  await page.getByLabel('Nombre completo').fill('María Fernanda Torres');
  await page.getByLabel('Correo electrónico').fill('mftorres@unisalle..edu.co');
  await page.getByLabel('Asunto').fill('Certificado de notas');
  await page.getByLabel('Mensaje').fill('Mensaje de prueba con correo mal escrito.');
  await page.getByRole('button', { name: 'Enviar mensaje' }).click();
  await page.waitForLoadState('networkidle');
  await captura('CF-02_2_correo_mal_formado');

  assert.equal(envios, 0, 'ningún envío inválido debe llegar al servidor');
  assert.equal(storage.count(), 0);
  assert.match(await page.locator('#correo-error').innerText(), /no tiene un formato válido/);
});
