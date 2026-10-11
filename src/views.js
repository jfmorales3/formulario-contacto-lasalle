const path = require('node:path');
const escape = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

function layout(config, title, content) {
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escape(title)} | La Salle</title>
  <link rel="stylesheet" href="/styles.css">
</head>
<body data-env="${escape(config.env)}">
  <div class="env-ribbon">Ambiente: <strong>${escape(config.label)}</strong></div>
  <header class="topbar">
    <a class="brand" href="/"><span class="brand-mark">LS</span> Universidad de La Salle</a>
    <nav><a href="/">Inicio</a><a href="/contacto">Contacto</a></nav>
  </header>
  <main class="container">${content}</main>
  ${config.showDebugPanel ? debugPanel(config) : ''}
  <footer class="footer">Formulario de contacto La Salle · Ingeniería de Software · Actividad 4</footer>
</body>
</html>`;
}

function debugPanel(config) {
  return `<aside class="debug-panel" aria-label="Panel de depuración">
    <h2>Depuración</h2>
    <dl>
      <dt>NODE_ENV</dt><dd>${escape(config.env)}</dd>
      <dt>LOG_LEVEL</dt><dd>${escape(config.logLevel)}</dd>
      <dt>Archivo de datos</dt><dd>${escape(path.relative(process.cwd(), config.dataFile))}</dd>
      <dt>Prefijo de radicado</dt><dd>${escape(config.recordPrefix)}</dd>
      <dt>Ruta admin</dt><dd>${config.adminToken ? 'habilitada' : 'deshabilitada (sin ADMIN_TOKEN)'}</dd>
    </dl>
  </aside>`;
}

function homePage(config) {
  return layout(config, 'Inicio', `
    <section class="hero">
      <p class="eyebrow">Oficina de atención al estudiante</p>
      <h1>Formulario de contacto La Salle</h1>
      <p class="lead">¿Tiene una inquietud académica, administrativa o de bienestar? Escríbanos y le responderemos con un número de radicado para su seguimiento.</p>
      <a class="button" href="/contacto">Escribir un mensaje</a>
    </section>
    <section class="features">
      <article><h3>1. Diligencie</h3><p>Nombre, correo, asunto y mensaje.</p></article>
      <article><h3>2. Validamos</h3><p>Revisamos campos obligatorios y formato del correo.</p></article>
      <article><h3>3. Radicamos</h3><p>Guardamos su mensaje y le damos un número de seguimiento.</p></article>
    </section>`);
}

function formPage(config, { values = {}, errors = {} } = {}) {
  const field = (name, label, type = 'text') => {
    const error = errors[name];
    const input =
      type === 'textarea'
        ? `<textarea id="${name}" name="${name}" rows="6" required maxlength="1000" aria-invalid="${!!error}">${escape(values[name])}</textarea>`
        : `<input id="${name}" name="${name}" type="${type}" value="${escape(values[name])}" required aria-invalid="${!!error}">`;
    return `<div class="field${error ? ' has-error' : ''}">
        <label for="${name}">${label} <span aria-hidden="true">*</span></label>
        ${input}
        <p class="field-error" id="${name}-error" role="alert">${error ? escape(error) : ''}</p>
      </div>`;
  };

  const summary = Object.keys(errors).length
    ? `<div class="alert alert-error" role="alert">No se pudo enviar el formulario. Revise los campos marcados.</div>`
    : '';

  return layout(config, 'Contacto', `
    <section class="card">
      <h1>Contáctenos</h1>
      <p class="muted">Todos los campos marcados con * son obligatorios.</p>
      ${summary}
      <form id="contact-form" method="post" action="/contacto" novalidate>
        ${field('nombre', 'Nombre completo')}
        ${field('correo', 'Correo electrónico', 'email')}
        ${field('asunto', 'Asunto')}
        ${field('mensaje', 'Mensaje', 'textarea')}
        <button class="button" type="submit">Enviar mensaje</button>
      </form>
    </section>
    <script src="/form.js" defer></script>`);
}

function thanksPage(config, record) {
  return layout(config, 'Mensaje recibido', `
    <section class="card success">
      <div class="alert alert-success" role="status">¡Gracias, ${escape(record.nombre)}! Su mensaje fue recibido correctamente.</div>
      <p>Número de radicado:</p>
      <p class="radicado">${escape(record.radicado)}</p>
      <p class="muted">Asunto: ${escape(record.asunto)}. Responderemos a <strong>${escape(record.correo)}</strong>.</p>
      <a class="button" href="/contacto">Enviar otro mensaje</a>
    </section>`);
}

function notFoundPage(config) {
  return layout(config, 'No encontrado', `
    <section class="card"><h1>Página no encontrada</h1><p><a href="/">Volver al inicio</a></p></section>`);
}

function errorPage(config, err) {
  const detail = config.showDebugPanel && err ? `<pre class="stack">${escape(err.stack)}</pre>` : '';
  return layout(config, 'Error', `
    <section class="card"><h1>Ocurrió un error inesperado</h1><p>Intente de nuevo más tarde.</p>${detail}</section>`);
}

module.exports = { homePage, formPage, thanksPage, notFoundPage, errorPage };
