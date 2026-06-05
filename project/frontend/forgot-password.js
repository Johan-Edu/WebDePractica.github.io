const API_URL = '/api';

document.addEventListener('DOMContentLoaded', () => {
  initForgotPasswordForm();
});

function initForgotPasswordForm() {
  const form = document.getElementById('forgot-password-form');
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;

    try {
      submitBtn.innerHTML = 'Enviando... <i class="ph ph-spinner animate-spin"></i>';
      submitBtn.disabled = true;

      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (response.ok) {
        // Mostrar mensaje de éxito
        form.innerHTML = `
          <div style="text-align: center; padding: 20px;">
            <div style="width: 64px; height: 64px; background: #10b981; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;">
              <i class="ph ph-check" style="font-size: 2rem; color: white;"></i>
            </div>
            <h2 style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 1.5rem; margin-bottom: 12px;">¡Email enviado!</h2>
            <p style="color: var(--text-muted); margin-bottom: 24px;">
              ${data.message}
            </p>
            ${data.resetLink ? `
              <div style="background: #f3f4f6; padding: 12px; border-radius: 8px; margin-bottom: 20px;">
                <p style="font-size: 0.85rem; margin-bottom: 8px;"><strong>Enlace de desarrollo:</strong></p>
                <a href="${data.resetLink}" style="color: #3b82f6; word-break: break-all;">${data.resetLink}</a>
              </div>
            ` : ''}
            <a href="login.html" class="btn btn-primary btn-full">
              Volver al inicio de sesión
            </a>
          </div>
        `;
      } else {
        alert(data.error || 'Error al enviar el email');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error de conexión. Intenta de nuevo.');
    } finally {
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
    }
  });
}
