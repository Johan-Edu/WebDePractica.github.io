document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const postId = urlParams.get('id');

  if (!postId) {
    alert('ID de post no válido');
    window.location.href = '../posts.html';
    return;
  }

  checkAuth();
  loadPost(postId);
  initForm(postId);
  initCounters();
});

function checkAuth() {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));
  
  if (!token || !user) {
    alert('Debes iniciar sesión para editar un post');
    window.location.href = '../login.html';
    return;
  }
  
  updateNav();
}

function updateNav() {
  const user = JSON.parse(localStorage.getItem('user'));
  const authButtons = document.getElementById('auth-buttons');
  
  if (authButtons) {
    authButtons.innerHTML = `
      <a href="../index.html" style="color: var(--text-muted); margin-right: 12px; text-decoration: none;">Inicio</a>
      <a href="../posts.html" style="color: var(--text-muted); margin-right: 12px; text-decoration: none;">Artículos</a>
      <a href="../perfil.html" style="color: var(--text-muted); margin-right: 12px; text-decoration: none;">Hola, ${user.name}</a>
      <button onclick="logout()" style="padding: 8px 16px; background: #ef4444; color: white; border: none; border-radius: 8px; cursor: pointer;">Cerrar sesión</button>
    `;
  }
}

async function loadPost(id) {
  try {
    const response = await fetch(`/api/posts/${id}`);
    
    if (!response.ok) {
      throw new Error('Post not found');
    }
    
    const post = await response.json();
    console.log('📰 Post cargado:', post);
    
    // Verificar si el usuario actual es el autor
    const currentUser = JSON.parse(localStorage.getItem('user'));
    if (post.author_id !== currentUser.id) {
      alert('No tienes permiso para editar este artículo');
      window.location.href = `../post/post.html?id=${id}`;
      return;
    }
    
    // Cargar los datos en el formulario
    document.getElementById('title').value = post.title;
    document.getElementById('content').value = post.content;
    document.getElementById('category').value = post.category;
    document.getElementById('gradient').value = post.image_gradient || '';
    
    // Actualizar contadores
    document.getElementById('title-count').textContent = post.title.length;
    document.getElementById('content-count').textContent = post.content.length;
    
    // Actualizar enlace de cancelar
    document.getElementById('cancel-btn').href = `../post/post.html?id=${id}`;
    
  } catch (error) {
    console.error('Error cargando post:', error);
    alert('Error al cargar el artículo');
    window.location.href = '../posts.html';
  }
}

function initCounters() {
  const titleInput = document.getElementById('title');
  const contentInput = document.getElementById('content');
  const titleCount = document.getElementById('title-count');
  const contentCount = document.getElementById('content-count');
  
  titleInput.addEventListener('input', () => {
    titleCount.textContent = titleInput.value.length;
  });
  
  contentInput.addEventListener('input', () => {
    contentCount.textContent = contentInput.value.length;
  });
}

function initForm(postId) {
  const form = document.getElementById('edit-form');
  
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const token = localStorage.getItem('token');
    const submitBtn = document.getElementById('submit-btn');
    const originalText = submitBtn.innerHTML;
    
    const title = document.getElementById('title').value.trim();
    const content = document.getElementById('content').value.trim();
    const category = document.getElementById('category').value;
    const image_gradient = document.getElementById('gradient').value;
    
    if (!title || !content || !category) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }
    
    try {
      submitBtn.innerHTML = '<i class="ph ph-spinner"></i> Guardando...';
      submitBtn.disabled = true;
      
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'PUT',
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
      
      const data = await response.json();
      
      if (response.ok) {
        alert('¡Artículo actualizado exitosamente!');
        window.location.href = `../post/post.html?id=${postId}`;
      } else {
        alert(data.error || 'Error al actualizar el artículo');
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

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '../login.html';
}
