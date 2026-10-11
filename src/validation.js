const EMAIL_PATTERN = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

const FIELDS = {
  nombre: { label: 'Nombre', max: 80 },
  correo: { label: 'Correo electrónico', max: 120 },
  asunto: { label: 'Asunto', max: 120 },
  mensaje: { label: 'Mensaje', max: 1000 },
};

function normalize(body = {}) {
  const data = {};
  for (const field of Object.keys(FIELDS)) {
    const value = body[field];
    data[field] = typeof value === 'string' ? value.trim() : '';
  }
  return data;
}

function validateContact(body) {
  const data = normalize(body);
  const errors = {};

  for (const [field, rule] of Object.entries(FIELDS)) {
    if (!data[field]) {
      errors[field] = `El campo "${rule.label}" es obligatorio.`;
    } else if (data[field].length > rule.max) {
      errors[field] = `El campo "${rule.label}" admite máximo ${rule.max} caracteres.`;
    }
  }

  if (data.correo && !errors.correo && !EMAIL_PATTERN.test(data.correo)) {
    errors.correo = 'El correo electrónico no tiene un formato válido (ejemplo: usuario@lasalle.edu.co).';
  }

  return { valid: Object.keys(errors).length === 0, errors, data };
}

module.exports = { validateContact, EMAIL_PATTERN, FIELDS };
