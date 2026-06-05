const API_URL = '/api';

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');

  if (!token) {
    alert('Token no válido');
    window.location.href = 'login.html';
    return;
  }

  initResetPasswordForm(token);
});

function initResetPasswordForm(token) {
  const form = document.getElementById('reset-password-form');
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (newPassword !== confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }

    if (newPassword.length < 8) {
      alert('Mínimo 8 caracteres');
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;

    try {
      submitBtn.innerHTML = 'Actualizando...';
      submitBtn.disabled = true;

      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword })
      });

      const data = await response.json();

      if (response.ok) {
        form.innerHTML = `
          <div style="text-align: center; padding: 20px;">
            <div style="width: 64px; height: 64px; background: #10b981; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;">
              <i class="ph ph-check" style="font-size: 2rem; color: white;"></i>
            </div>
            <h2 style="margin-bottom: 12px;">¡Contraseña actualizada!</h2>
            <p style="color: var(--text-muted); margin-bottom: 24px;">
              Tu contraseña ha sido restablecida.
            </p>
            <a href="login.html" class="btn btn-primary btn-full">
              Iniciar sesión
            </a>
          </div>
        `;
      } else {
        alert(data.error || 'Error al restablecer');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error de conexión');
    } finally {
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
    }
  });
}
