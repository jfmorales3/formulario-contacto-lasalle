# Actividad 8 · Plan y ejecución de pruebas

**Equipo 18** · Juan Felipe Jiménez Morales (`jfmorales3`) · Ingeniería de Software · Universidad de La Salle
Objeto de prueba: Formulario de contacto La Salle (Node.js 22 + Express 5), rama `test/actividad-8`.

## Cómo reproducir

```bash
npm ci
npx playwright install chromium   # solo la primera vez, para las pruebas funcionales
npm run test:unit                 # CU-01, CU-02
npm run test:integracion          # CI-01, CI-02
npm run test:e2e                  # CF-01, CF-02 (navegador Chromium sin interfaz)
npm run test:actividad8           # los seis casos con reporte detallado
npm test                          # regresión: pruebas previas + unitarias + integración
```

Todas las pruebas usan `config/test.env`: escriben en `data/test/contactos.json`, generan radicados `QA-…`
y limpian el archivo antes de cada caso. Los seis casos están automatizados.

## Estrategia

| Nivel | Herramienta | Qué revisa | Riesgo que cubre |
|---|---|---|---|
| Unitarias | `node:test` + `assert` | `validateContact()` en `src/validation.js`, aislada de HTTP y disco | Reglas de negocio mal implementadas: obligatorios, longitudes límite, formato del correo |
| Integración | `node:test` + `fetch` contra la app real | Ruta `POST /contacto` → validación → `storage.js` (archivo JSON) → vistas → `/salud` | Que los módulos, correctos por separado, no colaboren bien: radicados, persistencia, respuesta 422 |
| Funcionales / sistema | Playwright (Chromium) | El flujo completo como lo vive el usuario, incluida la validación en el navegador (`public/form.js`) | Que el usuario no pueda enviar su mensaje o que lleguen datos inválidos desde la interfaz |

## Casos de prueba

### CU-01 · Campos obligatorios y longitudes máximas (valores límite)
- **Tipo:** unitaria · **Archivo:** `tests/unitarias/validacion.test.js`
- **Objetivo:** comprobar que `validateContact()` exige los cuatro campos y respeta los máximos en el borde exacto.
- **Requisito / componente:** RF-02 Validar campos obligatorios y longitud · `src/validation.js`
- **Precondiciones:** dependencias instaladas; no requiere servidor.
- **Datos de entrada:** nombre de 80 y 81 caracteres; mensaje de 1000 y 1001; asunto `"   "`; mensaje `undefined`; nombre `"  Ana María Rojas  "`.
- **Pasos:** 1) llamar la función con los valores en el límite; 2) con los valores que exceden; 3) con campos vacíos; 4) con espacios externos.
- **Resultado esperado:** 80/1000 se aceptan; 81/1001 se rechazan con "admite máximo N caracteres"; asunto y mensaje vacíos se reportan; los espacios se recortan.
- **Resultado obtenido:** igual al esperado.
- **Estado:** ✅ Aprobado · **Evidencia:** `resultados/01_ejecucion_inicial.txt`, `resultados/02_ejecucion_tras_correccion.txt`

### CU-02 · Formato del correo electrónico
- **Tipo:** unitaria · **Archivo:** `tests/unitarias/validacion.test.js`
- **Objetivo:** verificar que el patrón de correo acepta direcciones reales y rechaza las mal formadas (partición de equivalencia).
- **Requisito / componente:** RF-03 Validar formato del correo · `EMAIL_PATTERN` en `src/validation.js`
- **Precondiciones:** dependencias instaladas.
- **Datos de entrada:** 3 válidos (`ana.rojas@lasalle.edu.co`, `qa_1+form@unisalle.edu.co`, `j-perez@mail.co`) y 9 inválidos (`estudiante@lasalle`, `sin-arroba.lasalle.edu.co`, `ana@@lasalle.edu.co`, `ana rojas@…`, `ana@lasalle..edu.co`, `.ana@…`, `ana.@…`, `ana..rojas@…`, `ana@-lasalle.edu.co`).
- **Pasos:** ejecutar una subprueba por cada correo y comparar `valid` y el mensaje de error.
- **Resultado esperado:** los 3 válidos pasan; los 9 inválidos devuelven "no tiene un formato válido".
- **Resultado obtenido (1.ª ejecución):** 5 de los 9 inválidos fueron **aceptados** (puntos consecutivos, punto inicial o final, dominio que empieza por guion).
- **Estado:** ❌ Fallido → ✅ Aprobado tras corregir DEF-01 · **Evidencia:** `resultados/01_ejecucion_inicial.txt` (fallo), `resultados/02_ejecucion_tras_correccion.txt` (aprobado)

### CI-01 · Envío válido: radicados consecutivos y persistencia
- **Tipo:** integración · **Archivo:** `tests/integracion/contacto.test.js`
- **Objetivo:** comprobar que ruta, validación, almacenamiento y vista colaboran para guardar y numerar los mensajes.
- **Requisito / componente:** RF-04 Registrar el mensaje y entregar radicado · `src/app.js` + `src/storage.js` + `src/views.js`
- **Precondiciones:** app levantada en puerto aleatorio con `NODE_ENV=test`; archivo de datos vacío.
- **Datos de entrada:** dos envíos válidos (Carlos Mendoza y Laura Pinzón, correos `@lasalle.edu.co`).
- **Pasos:** 1) `POST /contacto` dos veces; 2) leer `data/test/contactos.json`; 3) consultar `GET /salud`.
- **Resultado esperado:** dos respuestas 201 con `QA-0001` y `QA-0002`; el archivo tiene 2 registros con `ambiente: "test"` y fecha ISO válida; `/salud` informa 2.
- **Resultado obtenido:** igual al esperado.
- **Estado:** ✅ Aprobado · **Evidencia:** `resultados/02_ejecucion_tras_correccion.txt`

### CI-02 · Envío inválido: 422 sin persistir y conservando lo escrito
- **Tipo:** integración · **Archivo:** `tests/integracion/contacto.test.js`
- **Objetivo:** verificar que un envío inválido no llega al almacenamiento y que la vista devuelve lo escrito, escapado.
- **Requisito / componente:** RF-02, RF-03 y RNF-Seguridad (escape de HTML) · `src/app.js` + `src/views.js` + `src/storage.js`
- **Precondiciones:** app levantada con `NODE_ENV=test`; archivo vacío.
- **Datos de entrada:** nombre `Carlos <b>Mendoza</b>`, correo `carlos@lasalle`, mensaje vacío.
- **Pasos:** 1) `POST /contacto`; 2) revisar el HTML; 3) leer el archivo y `/salud`.
- **Resultado esperado:** HTTP 422, alerta general, error de correo y de mensaje, `value` del nombre escapado (`&lt;b&gt;`), archivo `[]` y `/salud` en 0.
- **Resultado obtenido:** igual al esperado.
- **Estado:** ✅ Aprobado · **Evidencia:** `resultados/02_ejecucion_tras_correccion.txt`

### CF-01 · El usuario diligencia y envía el formulario desde el navegador
- **Tipo:** funcional / sistema · **Archivo:** `tests/funcionales/formulario.e2e.js`
- **Objetivo:** validar de punta a punta el flujo principal tal como lo usa una persona.
- **Requisito / componente:** RF-01 Enviar un mensaje de contacto y recibir radicado · sistema completo
- **Precondiciones:** servidor en ambiente de pruebas; Chromium de Playwright instalado; almacenamiento vacío.
- **Datos de entrada:** María Fernanda Torres · `mftorres@unisalle.edu.co` · "Certificado de notas" · mensaje de 67 caracteres.
- **Pasos:** 1) abrir `/`; 2) clic en "Escribir un mensaje"; 3) llenar los cuatro campos por su etiqueta; 4) clic en "Enviar mensaje".
- **Resultado esperado:** página de confirmación "¡Gracias, María Fernanda Torres!", radicado `QA-0001`, un solo `POST` y el correo guardado.
- **Resultado obtenido:** igual al esperado.
- **Estado:** ✅ Aprobado · **Evidencia:** `evidencias/CF-01_1_formulario_diligenciado.png`, `evidencias/CF-01_2_confirmacion_radicado.png`

### CF-02 · La validación del navegador bloquea envíos inválidos
- **Tipo:** funcional / sistema · **Archivo:** `tests/funcionales/formulario.e2e.js`
- **Objetivo:** comprobar que la interfaz detiene envíos vacíos o con correo mal escrito antes de llegar al servidor.
- **Requisito / componente:** RF-02, RF-03 · `public/form.js` + vista del formulario
- **Precondiciones:** iguales a CF-01.
- **Datos de entrada:** formulario vacío; luego los mismos datos de CF-01 con correo `mftorres@unisalle..edu.co`.
- **Pasos:** 1) abrir `/contacto` y pulsar "Enviar" sin datos; 2) llenar los campos con el correo mal formado; 3) pulsar "Enviar".
- **Resultado esperado:** 4 campos marcados y foco en "Nombre"; con el correo mal formado aparece el error bajo el campo; 0 peticiones `POST` y 0 registros.
- **Resultado obtenido (1.ª ejecución):** el paso 1 se comportó bien, pero en el paso 3 el formulario **se envió** y el servidor entregó el radicado `QA-0001` a un correo inválido.
- **Estado:** ❌ Fallido → ✅ Aprobado tras corregir DEF-01 · **Evidencia:** `evidencias/CF-02_1_campos_vacios.png`, `evidencias/CF-02_2_correo_mal_formado_FALLO.png` (antes), `evidencias/CF-02_2_correo_mal_formado.png` (después)

## Defecto encontrado

### DEF-01 · El validador acepta correos con puntos o guiones mal ubicados
- **Severidad:** media. El usuario no recibe la respuesta y el radicado queda asociado a un correo inexistente.
- **Detectado por:** CU-02 (unitaria) y CF-02 (funcional). El mismo error aparecía en el servidor y en el navegador.
- **Causa:** el patrón original `^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$` permite el punto y el guion en cualquier
  posición de la parte local y del dominio. Además estaba duplicado en `src/validation.js` y `public/form.js`.
- **Corrección:** la parte local se arma con segmentos separados por un solo punto y cada etiqueta del dominio debe empezar
  y terminar en letra o número:
  `^[A-Za-z0-9_%+-]+(\.[A-Za-z0-9_%+-]+)*@([A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])?\.)+[A-Za-z]{2,}$`
  Se aplicó en los dos archivos.
- **Nueva ejecución:** 18/18 casos aprobados (`resultados/02_ejecucion_tras_correccion.txt`) y regresión `npm test` 24/24 (`resultados/03_regresion_npm_test.txt`).
- **Acción pendiente:** servir el patrón desde un único módulo compartido para que servidor y navegador no vuelvan a divergir.

### Vulnerabilidad en dependencias
- `npm audit` reportó una vulnerabilidad alta en `body-parser` 2.3.0, dependencia de Express (GHSA-27r3-jxmh-p828).
- **Corrección:** `npm audit fix` la actualizó a 2.4.0; solo cambia `package-lock.json`.
- **Nueva ejecución:** `npm audit` sin vulnerabilidades, `npm test` 24/24 y `npm run test:e2e` 2/2 (`resultados/04_npm_audit.txt`).

## Resumen

| ID | Tipo | Nombre | 1.ª ejecución | Tras corrección |
|---|---|---|---|---|
| CU-01 | Unitaria | Obligatorios y longitudes límite | ✅ | ✅ |
| CU-02 | Unitaria | Formato del correo | ❌ (5/12 subpruebas) | ✅ |
| CI-01 | Integración | Envío válido y radicados consecutivos | ✅ | ✅ |
| CI-02 | Integración | Envío inválido sin persistir | ✅ | ✅ |
| CF-01 | Funcional | Envío desde el navegador | ✅ | ✅ |
| CF-02 | Funcional | Validación en el navegador | ❌ | ✅ |

## Integración continua

El workflow `.github/workflows/pruebas.yml` ejecuta `npm test` y las pruebas E2E en cada push a `test/**` y en cada
pull request a `main`. Ejecuciones de esta rama: https://github.com/jfmorales3/formulario-contacto-lasalle/actions?query=branch%3Atest%2Factividad-8
(captura en `evidencias/CI_github_actions.png`).
