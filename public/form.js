// Validación en el navegador: mejora la experiencia, pero el servidor vuelve a validar todo.
(function () {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const EMAIL_PATTERN = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  const labels = { nombre: 'Nombre', correo: 'Correo electrónico', asunto: 'Asunto', mensaje: 'Mensaje' };

  function check(input) {
    const value = input.value.trim();
    let message = '';
    if (!value) message = 'El campo "' + labels[input.name] + '" es obligatorio.';
    else if (input.name === 'correo' && !EMAIL_PATTERN.test(value)) {
      message = 'El correo electrónico no tiene un formato válido (ejemplo: usuario@lasalle.edu.co).';
    }
    const wrapper = input.closest('.field');
    wrapper.classList.toggle('has-error', !!message);
    input.setAttribute('aria-invalid', String(!!message));
    document.getElementById(input.name + '-error').textContent = message;
    return !message;
  }

  const inputs = Array.from(form.querySelectorAll('input, textarea'));
  inputs.forEach((input) => input.addEventListener('blur', () => check(input)));

  form.addEventListener('submit', (event) => {
    const results = inputs.map(check);
    if (results.includes(false)) {
      event.preventDefault();
      form.querySelector('[aria-invalid="true"]').focus();
    }
  });
})();
