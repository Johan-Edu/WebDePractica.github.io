document.addEventListener('DOMContentLoaded', () => {
  console.log('✅ Página de posts cargada');
  loadPosts();
  updateNav();
});

function updateNav() {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));
  const authButtons = document.getElementById('auth-buttons');
  
  if (!authButtons) return;
  
  if (token && user) {
    authButtons.innerHTML = `
      <a href="crear-post.html" style="color: var(--text-muted); margin-right: 12px; text-decoration: none; font-weight: 500;">
        <i class="ph ph-plus-circle"></i> Crear Post
      </a>
      <a href="perfil.html" style="color: var(--text-muted); margin-right: 12px; text-decoration: none; font-weight: 500;">
        Hola, ${user.name}
      </a>
      <button onclick="logout()" style="padding: 8px 16px; background: #ef4444; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
        Cerrar sesión
      </button>
    `;
  } else {
    authButtons.innerHTML = `
      <a href="login.html" style="padding: 8px 16px; background: var(--primary); color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
        Iniciar sesión
      </a>
    `;
  }
}

async function loadPosts() {
  const grid = document.getElementById('posts-grid');
  const noPosts = document.getElementById('no-posts');
  
  try {
    const response = await fetch('/api/posts');
    const posts = await response.json();
    
    console.log('📰 Posts cargados:', posts.length);
    
    if (!posts || posts.length === 0) {
      grid.style.display = 'none';
      noPosts.style.display = 'block';
      return;
    }
    
    grid.innerHTML = posts.map(post => createPostCard(post)).join('');
    
  } catch (error) {
    console.error('Error cargando posts:', error);
    grid.innerHTML = '<p style="color: white; text-align: center;">Error al cargar los artículos</p>';
  }
}

function createPostCard(post) {
  const date = new Date(post.created_at).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
  
  const excerpt = post.content.length > 150 
    ? post.content.substring(0, 150) + '...' 
    : post.content;
  
  const authorInitial = post.author_name ? post.author_name.charAt(0).toUpperCase() : '?';
  
  const gradient = post.image_gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
  
  return `
    <a href="post/post.html?id=${post.id}" class="post-card">
      <div class="post-image" style="background: ${gradient};">
        <i class="ph ph-article"></i>
      </div>
      <div class="post-content">
        <span class="post-category">${post.category}</span>
        <h3 class="post-title">${post.title}</h3>
        <p class="post-excerpt">${excerpt}</p>
        <div class="post-meta">
          <div class="post-author">
            <div class="author-avatar">${authorInitial}</div>
            <span>${post.author_name || 'Anónimo'}</span>
          </div>
          <span>${date}</span>
        </div>
      </div>
    </a>
  `;
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'login.html';
}
