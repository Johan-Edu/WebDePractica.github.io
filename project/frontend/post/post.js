document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const postId = urlParams.get('id');

  if (!postId) {
    showError();
    return;
  }

  updateNav();
  loadPost(postId);
});

function updateNav() {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));
  const authButtons = document.getElementById('auth-buttons');

  if (!authButtons) return;

  if (token && user) {
    authButtons.innerHTML = `
      <a href="../index.html" style="color: var(--text-muted); margin-right: 12px; text-decoration: none;">Inicio</a>
      <a href="../posts.html" style="color: var(--text-muted); margin-right: 12px; text-decoration: none;">Artículos</a>
      <a href="../perfil.html" style="color: var(--text-muted); margin-right: 12px; text-decoration: none;">Hola, ${user.name}</a>
      <button onclick="logout()" style="padding: 8px 16px; background: #ef4444; color: white; border: none; border-radius: 8px; cursor: pointer;">Cerrar sesión</button>
    `;
  } else {
    authButtons.innerHTML = `
      <a href="../login.html" style="padding: 8px 16px; background: var(--primary); color: white; text-decoration: none; border-radius: 8px;">Iniciar sesión</a>
    `;
  }
}

async function loadPost(id) {
  const article = document.getElementById('post-article');
  const loading = document.getElementById('loading');
  const error = document.getElementById('error');

  try {
    const response = await fetch(`/api/posts/${id}`);

    if (!response.ok) {
      throw new Error('Post not found');
    }

    const post = await response.json();
    console.log('📰 Post cargado:', post);

    loading.style.display = 'none';
    error.style.display = 'none';
    article.style.display = 'block';

    const gradient = post.image_gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    const authorInitial = post.author_name ? post.author_name.charAt(0).toUpperCase() : '?';
    const date = new Date(post.created_at).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Verificar si el usuario actual es el autor
    const currentUser = JSON.parse(localStorage.getItem('user'));
    const isAuthor = currentUser && post.author_id === currentUser.id;

    article.innerHTML = `
      <header class="post-header" style="background: ${gradient};">
        <span class="post-category">${post.category}</span>
        <h1 class="post-title">${post.title}</h1>
        <div class="post-meta">
          <div class="post-author">
            <div class="author-avatar">${authorInitial}</div>
            <span>${post.author_name || 'Anónimo'}</span>
          </div>
          <span>•</span>
          <span>${date}</span>
        </div>
      </header>

      <div class="post-body">${post.content}</div>

      <footer class="post-footer">
        <a href="../posts.html" class="btn-back">
          <i class="ph ph-arrow-left"></i> Volver a artículos
        </a>
        <div style="display: flex; gap: 12px;">
          ${isAuthor ? `
            <a href="../edit-post/edit-post.html?id=${post.id}" class="btn-edit">
              <i class="ph ph-pencil-simple"></i> Editar
            </a>
            <button onclick="deletePost(${post.id})" class="btn-delete">
              <i class="ph ph-trash"></i> Eliminar
            </button>
          ` : ''}
        </div>
      </footer>
    `;

  } catch (error) {
    console.error('Error cargando post:', error);
    loading.style.display = 'none';
    error.style.display = 'block';
  }
}

function showError() {
  document.getElementById('loading').style.display = 'none';
  document.getElementById('error').style.display = 'block';
}

async function deletePost(id) {
  if (!confirm('¿Estás seguro de que quieres eliminar este artículo? Esta acción no se puede deshacer.')) {
    return;
  }

  const token = localStorage.getItem('token');

  try {
    const response = await fetch(`/api/posts/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();

    if (response.ok) {
      alert('Artículo eliminado exitosamente');
      window.location.href = '../posts.html';
    } else {
      alert(data.error || 'Error al eliminar el artículo');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error de conexión. Intenta de nuevo.');
  }
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '../login.html';
}
