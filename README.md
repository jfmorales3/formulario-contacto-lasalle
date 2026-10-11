# Formulario de contacto La Salle

[![Pruebas](https://github.com/jfmorales3/formulario-contacto-lasalle/actions/workflows/pruebas.yml/badge.svg)](https://github.com/jfmorales3/formulario-contacto-lasalle/actions/workflows/pruebas.yml)

Aplicación web en **Node.js + Express** que demuestra cómo una misma base de código se ejecuta de forma
controlada en tres ambientes: **desarrollo**, **pruebas** y **producción/demostración**.

## Requisitos

- Node.js **22.9 o superior** (`node -v`)
- npm (incluido con Node.js)

## Instalación

```bash
npm install          # descarga Express en node_modules/ (no se incluye en el .zip)
cp .env.example .env # opcional: solo si desea definir ADMIN_TOKEN localmente
```

## Cómo se separan los ambientes

Cada ambiente tiene su propio archivo de configuración **sin secretos** en `config/`, que Node carga con
la opción nativa `--env-file`. Los valores secretos (por ahora solo `ADMIN_TOKEN`) van en `.env` local o en
el panel de Vercel, nunca en el repositorio.

| Variable           | Desarrollo                      | Pruebas                  | Producción                       |
|--------------------|---------------------------------|--------------------------|----------------------------------|
| `NODE_ENV`         | development                     | test                     | production                       |
| `PORT`             | 3000                            | 3001                     | 8080 local (Vercel no lo usa)     |
| `LOG_LEVEL`        | debug (cada petición y registro)| info                     | error                            |
| `SHOW_DEBUG_PANEL` | true                            | true                     | false (forzado en el código)     |
| `DATA_FILE`        | data/development/contactos.json | data/test/contactos.json | data/production/contactos.json   |
| `RECORD_PREFIX`    | DEV-0001…                       | QA-0001…                 | LS-0001…                         |

## Ejecución

### 1. Desarrollo

```bash
npm run seed   # (opcional) crea registros ficticios marcados con [DEV]
npm run dev    # http://127.0.0.1:3000 — se reinicia solo al guardar cambios (--watch)
```

Se ve una franja morada "Ambiente: Desarrollo", un panel de depuración al pie de la página y en la
terminal aparece un log `DEBUG` por cada petición.

### 2. Pruebas

```bash
npm test          # ejecuta los casos CP-01, CP-02 y CP-03 automáticamente
npm run start:test  # (opcional) levanta el servidor de pruebas en http://127.0.0.1:3001 para probar a mano
```

Las pruebas usan `config/test.env`, por lo que escriben en `data/test/contactos.json` y nunca tocan los
datos de desarrollo ni de producción. El archivo se limpia antes de cada caso.

| Caso  | Descripción                         | Resultado esperado                                  |
|-------|-------------------------------------|-----------------------------------------------------|
| CP-01 | Envío correcto                      | HTTP 201, página de confirmación con radicado QA-0001 |
| CP-02 | Campo obligatorio vacío (asunto)    | HTTP 422, mensaje "El campo "Asunto" es obligatorio", nada guardado |
| CP-03 | Correo inválido (`estudiante@lasalle`) | HTTP 422, mensaje de formato inválido, nada guardado |

### 3. Producción / demostración

```bash
npm start      # http://0.0.0.0:8080 — sin panel de depuración, solo logs de error
```

#### Despliegue gratuito en Vercel

La versión publicada corre en Vercel (plan gratuito Hobby), conectada a este repositorio de GitHub:
cada `git push` a `main` genera un nuevo despliegue de producción.

- `api/index.js` es el punto de entrada: carga `config/production.env` y exporta la app de Express.
- `vercel.json` envía todas las rutas a esa función; `public/` se sirve como archivos estáticos.
- `ADMIN_TOKEN` (opcional) se define en *Project Settings → Environment Variables*, nunca en el código.
- Vercel solo permite escribir en `/tmp`, así que los mensajes guardados en producción son temporales.
  Es aceptable para un ambiente de demostración.

Despliegue manual con la CLI: `npx vercel --prod`.

## Flujo de trabajo con Git

1. Cada tarea se registra como un **issue** en GitHub.
2. Se crea una rama desde `main` con un prefijo según el tipo de cambio:
   `feature/` (funcionalidad), `test/` (pruebas), `ci/` (automatización), `docs/` (documentación).
3. Los commits describen el cambio en español y citan el issue, por ejemplo `Agregar ruta /privacidad (#3)`.
4. Se abre un **pull request** hacia `main`. GitHub Actions ejecuta `npm test` y el PR solo se integra con las pruebas en verde.
5. Si hay conflicto, se trae `main` a la rama (`git merge main`), se resuelve, se ejecuta `npm test` y se sube la resolución.
6. Al integrar en `main`, Vercel publica automáticamente la nueva versión de producción.

```bash
git switch main && git pull
git switch -c feature/mi-cambio
# ...cambios...
npm test
git commit -m "Descripción del cambio (#N)"
git push -u origin feature/mi-cambio
gh pr create --fill
```

## Rutas

| Ruta                  | Descripción                                              |
|-----------------------|----------------------------------------------------------|
| `GET /`               | Página principal                                         |
| `GET /contacto`       | Formulario                                               |
| `POST /contacto`      | Valida, guarda y muestra la confirmación con radicado    |
| `GET /salud`          | Estado del servicio y ambiente activo (JSON)             |
| `GET /admin/mensajes` | Lista de mensajes; requiere `Authorization: Bearer <ADMIN_TOKEN>` |

## Estructura

```
formulario-lasalle/
├── api/index.js         # punto de entrada para Vercel (producción)
├── config/              # development.env, test.env, production.env (sin secretos)
├── data/                # almacenamiento JSON por ambiente (ignorado por git)
├── public/              # styles.css, form.js (validación en el navegador)
├── scripts/seed-dev.js  # datos ficticios solo para desarrollo
├── src/
│   ├── app.js           # rutas y middlewares de Express
│   ├── config.js        # lectura y validación de variables de entorno
│   ├── logger.js        # registro con niveles según el ambiente
│   ├── server.js        # punto de entrada
│   ├── storage.js       # persistencia en archivo JSON
│   ├── validation.js    # reglas de campos obligatorios y correo
│   └── views.js         # plantillas HTML (con escape de caracteres)
├── tests/formulario.test.js
├── .env.example
└── vercel.json
```

## Seguridad

- No hay contraseñas, tokens ni claves en el código ni en `config/`. `.env.example` solo tiene un valor de muestra.
- Todo texto ingresado por el usuario se escapa antes de mostrarse (previene XSS).
- Cabeceras `Content-Security-Policy`, `X-Frame-Options` y `X-Content-Type-Options`.
- El cuerpo de las peticiones se limita a 20 KB y cada campo tiene longitud máxima.
- La comparación del token de administración usa `crypto.timingSafeEqual`.
