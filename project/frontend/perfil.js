
document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  loadProfile();
  initTabs();
  initProfileForm();
  initPasswordForm();
  initPasswordStrength();
});

// Verificar autenticación
function checkAuth() {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = 'login.html';
  }
}

// Cargar datos del perfil
async function loadProfile() {
  const token = localStorage.getItem('token');
  
  try {
    const response = await fetch(`${API_URL}/auth/profile`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const user = await response.json();

    if (response.ok) {
      document.getElementById('profile-name').value = user.name;
      document.getElementById('profile-email').value = user.email;
      
      // Formatear fecha
      const date = new Date(user.created_at);
      const formatted = date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      document.getElementById('member-since').textContent = formatted;
    } else {
      alert('Error al cargar el perfil');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Inicializar tabs
function initTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  const contents = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;

      tabs.forEach(t => t.classList.remove('active'));
      contents.forEach(c => c.classList.remove('active'));

      tab.classList.add('active');
      document.getElementById(`tab-${target}`).classList.add('active');
    });
  });
}

// Formulario de perfil
function initProfileForm() {
  const form = document.getElementById('profile-form');
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const token = localStorage.getItem('token');
    const name = document.getElementById('profile-name').value;
    const email = document.getElementById('profile-email').value;

    try {
      const response = await fetch(`${API_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, email })
      });

      const data = await response.json();

      if (response.ok) {
        alert('Perfil actualizado exitosamente');
        
        // Actualizar localStorage
        const user = JSON.parse(localStorage.getItem('user'));
        user.name = name;
        user.email = email;
        localStorage.setItem('user', JSON.stringify(user));
      } else {
        alert(data.error || 'Error al actualizar');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error de conexión');
    }
  });
}

// Formulario de contraseña
function initPasswordForm() {
  const form = document.getElementById('password-form');
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const token = localStorage.getItem('token');
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (newPassword !== confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }

    if (newPassword.length < 8) {
      alert('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await response.json();

      if (response.ok) {
        alert('Contraseña actualizada exitosamente');
        form.reset();
      } else {
        alert(data.error || 'Error al cambiar contraseña');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error de conexión');
    }
  });
}

// Indicador de fuerza de contraseña
function initPasswordStrength() {
  const passwordInput = document.getElementById('new-password');
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

// Cerrar sesión
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'login.html';
}