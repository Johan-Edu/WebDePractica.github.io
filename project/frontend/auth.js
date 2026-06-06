// ========== FRONTEND AUTH.JS ==========

const API_URL = '/api';

document.addEventListener('DOMContentLoaded', () => {
  initPasswordToggle();
  initPasswordStrength();
  initForms();
});

// Toggle mostrar/ocultar contraseña
function initPasswordToggle() {
  document.querySelectorAll('.toggle-password').forEach(btn => {
    btn.addEventListener('click', () => {
      const input = btn.parentElement.querySelector('input');
      const icon = btn.querySelector('i');

      if (input.type === 'password') {
        input.type = 'text';
        icon.classList.replace('ph-eye', 'ph-eye-slash');
      } else {
        input.type = 'password';
        icon.classList.replace('ph-eye-slash', 'ph-eye');
      }
    });
  });
}

// Indicador de fuerza de contraseña
function initPasswordStrength() {
  const passwordInput = document.getElementById('password');
  const strengthText = document.querySelector('.strength-text');
  const bars = document.querySelectorAll('.bar');

  if (!passwordInput || bars.length === 0) return;

  const levels = [
    { text: 'Muy débil', color: '#ef4444' },
    { text: 'Débil', color: '#f97316' },
    { text: 'Media', color: '#eab308' },
    { text: 'Fuerte', color: '#10b981' }
  ];

  passwordInput.addEventListener('input', (e) => {
    const val = e.target.value;
    let strength = 0;

    if (val.length >= 8) strength++;
    if (/[A-Z]/.test(val)) strength++;
    if (/[0-9]/.test(val)) strength++;
    if (/[^A-Za-z0-9]/.test(val)) strength++;

    bars.forEach((bar, i) => {
      bar.style.background = i < strength
        ? levels[strength - 1].color
        : 'rgba(120, 113, 108, 0.15)';
    });

    if (val.length === 0) {
      strengthText.textContent = 'La contraseña es muy débil';
      strengthText.style.color = 'var(--text-muted)';
    } else {
      strengthText.textContent = `La contraseña es ${levels[strength - 1]?.text || 'muy débil'}`;
      strengthText.style.color = levels[strength - 1]?.color || 'var(--text-muted)';
    }
  });
}

// Inicializar formularios
function initForms() {
  // Registro
  const registerForm = document.querySelector('#register-form');
  if (registerForm) {
    registerForm.addEventListener('submit', handleRegister);
  }

  // Login
  const loginForm = document.querySelector('#login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }
}

// Manejar registro
async function handleRegister(e) {
  e.preventDefault();
  
  const form = e.target;
  const name = form.querySelector('#name')?.value;
  const email = form.querySelector('#email').value;
  const password = form.querySelector('#password').value;
  const terms = form.querySelector('input[type="checkbox"]');

  if (terms && !terms.checked) {
    alert('Debes aceptar los términos y condiciones');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });

    const data = await response.json();

    if (response.ok) {
      // Guardar token
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Redirigir
      alert('¡Cuenta creada exitosamente!');
      window.location.href = 'index.html';
    } else {
      alert(data.error || 'Error al registrar');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error de conexión. Asegúrate de que el backend esté corriendo');
  }
}

// Manejar login
async function handleLogin(e) {
  e.preventDefault();
  
  const form = e.target;
  const email = form.querySelector('#email').value;
  const password = form.querySelector('#password').value;

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (response.ok) {
      // Guardar token y usuario
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // Redirigir
      window.location.href = 'index.html';
    } else {
      alert(data.error || 'Credenciales inválidas');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error de conexión. Asegúrate de que el backend esté corriendo');
  }
}

// Verificar si el usuario está logueado
function isAuthenticated() {
  return localStorage.getItem('token') !== null;
}

// Cerrar sesión
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'login.html';
}

// Login con GitHub
function loginWithGitHub() {
  window.location.href = '/api/auth/github';
}

// Procesar OAuth al regresar
function processOAuthLogin() {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  const user = urlParams.get('user');
  
  if (token && user) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', user);
    window.history.replaceState({}, document.title, window.location.pathname);
    if (typeof updateNav === 'function') {
      updateNav();
    }
  }
}

// Ejecutar al cargar
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    processOAuthLogin();
  });
}

// Cerrar sesión
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'index.html';
}
