
document.addEventListener('DOMContentLoaded', () => {
  console.log('✅ Página cargada');
  checkAuth();
  initForm();
  initCounters();
});

function checkAuth() {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));
  
  console.log('Token:', token ? 'Existe' : 'No existe');
  console.log('User:', user);
  
  if (!token || !user) {
    alert('Debes iniciar sesión para crear un post');
    window.location.href = 'login.html';
    return false;
  }
  
  updateNav();
  return true;
}

function updateNav() {
  const user = JSON.parse(localStorage.getItem('user'));
  const authButtons = document.getElementById('auth-buttons');
  
  if (authButtons) {
    authButtons.innerHTML = `
      <a href="index.html" style="color: var(--text-muted); margin-right: 12px; text-decoration: none;">Inicio</a>
      <a href="perfil.html" style="color: var(--text-muted); margin-right: 12px; text-decoration: none;">Hola, ${user.name}</a>
      <button onclick="logout()" style="padding: 8px 16px; background: #ef4444; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">Cerrar sesión</button>
    `;
  }
}

function initCounters() {
  const titleInput = document.getElementById('title');
  const contentInput = document.getElementById('content');
  const titleCount = document.getElementById('title-count');
  const contentCount = document.getElementById('content-count');
  
  if (titleInput && titleCount) {
    titleInput.addEventListener('input', () => {
      titleCount.textContent = titleInput.value.length;
    });
  }
  
  if (contentInput && contentCount) {
    contentInput.addEventListener('input', () => {
      contentCount.textContent = contentInput.value.length;
    });
  }
}

function initForm() {
  const form = document.getElementById('post-form');
  
  if (!form) {
    console.error('❌ No se encontró el formulario');
    return;
  }
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    console.log('📤 Enviando formulario...');
    
    const token = localStorage.getItem('token');
    const submitBtn = document.getElementById('submit-btn');
    const originalText = submitBtn ? submitBtn.innerHTML : '';
    
    const title = document.getElementById('title').value.trim();
    const content = document.getElementById('content').value.trim();
    const category = document.getElementById('category').value;
    const image_gradient = document.getElementById('gradient').value;
    
    console.log('Datos:', { title, content, category, image_gradient });
    
    if (!title || !content || !category) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }
    
    if (submitBtn) {
      submitBtn.innerHTML = '<i class="ph ph-spinner"></i> Publicando...';
      submitBtn.disabled = true;
    }
    
    try {
      const response = await fetch(`${API_URL}/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          content,
          category,
          image_gradient
        })
      });
      
      console.log('📥 Response status:', response.status);
      
      const data = await response.json();
      console.log('📥 Response data:', data);
      
      if (response.ok) {
        alert('¡Post publicado exitosamente!');
        window.location.href = 'index.html';
      } else {
        alert(data.error || 'Error al publicar el post');
      }
    } catch (error) {
      console.error('❌ Error:', error);
      alert('Error de conexión. Revisa la consola para más detalles.');
    } finally {
      if (submitBtn) {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
      }
    }
  });
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'login.html';
}
