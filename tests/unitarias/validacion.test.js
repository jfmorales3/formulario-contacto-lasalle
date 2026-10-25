const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validateContact } = require('../../src/validation');

const base = {
  nombre: 'Ana María Rojas',
  correo: 'ana.rojas@lasalle.edu.co',
  asunto: 'Consulta de inscripción',
  mensaje: 'Quisiera conocer las fechas de inscripción del próximo semestre.',
};

test('CU-01 campos obligatorios y longitudes máximas (valores límite)', () => {
  const limite = validateContact({ ...base, nombre: 'N'.repeat(80), mensaje: 'M'.repeat(1000) });
  assert.equal(limite.valid, true, 'nombre de 80 y mensaje de 1000 caracteres deben aceptarse');

  const excede = validateContact({ ...base, nombre: 'N'.repeat(81), mensaje: 'M'.repeat(1001) });
  assert.equal(excede.valid, false);
  assert.equal(excede.errors.nombre, 'El campo "Nombre" admite máximo 80 caracteres.');
  assert.equal(excede.errors.mensaje, 'El campo "Mensaje" admite máximo 1000 caracteres.');

  const vacio = validateContact({ ...base, asunto: '   ', mensaje: undefined });
  assert.equal(vacio.valid, false);
  assert.deepEqual(Object.keys(vacio.errors).sort(), ['asunto', 'mensaje']);

  const conEspacios = validateContact({ ...base, nombre: '  Ana María Rojas  ' });
  assert.equal(conEspacios.data.nombre, 'Ana María Rojas', 'los espacios externos se recortan');
});

test('CU-02 formato del correo electrónico', async (t) => {
  const validos = ['ana.rojas@lasalle.edu.co', 'qa_1+form@unisalle.edu.co', 'j-perez@mail.co'];
  const invalidos = [
    'estudiante@lasalle',
    'sin-arroba.lasalle.edu.co',
    'ana@@lasalle.edu.co',
    'ana rojas@lasalle.edu.co',
    'ana@lasalle..edu.co',
    '.ana@lasalle.edu.co',
    'ana.@lasalle.edu.co',
    'ana..rojas@lasalle.edu.co',
    'ana@-lasalle.edu.co',
  ];

  for (const correo of validos) {
    await t.test(`acepta ${correo}`, () => {
      assert.equal(validateContact({ ...base, correo }).valid, true);
    });
  }
  for (const correo of invalidos) {
    await t.test(`rechaza ${correo}`, () => {
      const r = validateContact({ ...base, correo });
      assert.equal(r.valid, false, `"${correo}" no debería aceptarse`);
      assert.match(r.errors.correo, /formato válido/);
    });
  }
});
