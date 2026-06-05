const express = require('express');
const db = require('../database');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Middleware de autenticación
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token requerido' });

  const jwt = require('jsonwebtoken');
  jwt.verify(token, 'tu-secreto-super-seguro-cambialo', (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido' });
    req.user = user;
    next();
  });
};

// Obtener todos los posts
router.get('/', (req, res) => {
  db.all(`
    SELECT posts.*, users.name as author_name 
    FROM posts 
    LEFT JOIN users ON posts.author_id = users.id 
    ORDER BY posts.created_at DESC
  `, [], (err, posts) => {
    if (err) return res.status(500).json({ error: 'Error al obtener posts' });
    res.json(posts);
  });
});

// Obtener un post específico
router.get('/:id', (req, res) => {
  db.get(`
    SELECT posts.*, users.name as author_name 
    FROM posts 
    LEFT JOIN users ON posts.author_id = users.id 
    WHERE posts.id = ?
  `, [req.params.id], (err, post) => {
    if (err) return res.status(500).json({ error: 'Error del servidor' });
    if (!post) return res.status(404).json({ error: 'Post no encontrado' });
    res.json(post);
  });
});

// Crear un post (requiere autenticación)
router.post('/',
  authenticateToken,
  [
    body('title').trim().notEmpty().withMessage('El título es requerido'),
    body('content').trim().notEmpty().withMessage('El contenido es requerido'),
    body('category').trim().notEmpty().withMessage('La categoría es requerida')
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, content, category, image_gradient } = req.body;

    db.run(
      'INSERT INTO posts (title, content, category, author_id, image_gradient) VALUES (?, ?, ?, ?, ?)',
      [title, content, category, req.user.id, image_gradient || null],
      function(err) {
        if (err) return res.status(500).json({ error: 'Error al crear post' });
        res.status(201).json({
          message: 'Post creado exitosamente',
          post: { id: this.lastID, title, content, category }
        });
      }
    );
  }
);

// Obtener comentarios de un post
router.get('/:id/comments', (req, res) => {
  db.all(`
    SELECT comments.*, users.name as user_name 
    FROM comments 
    LEFT JOIN users ON comments.user_id = users.id 
    WHERE comments.post_id = ? 
    ORDER BY comments.created_at DESC
  `, [req.params.id], (err, comments) => {
    if (err) return res.status(500).json({ error: 'Error al obtener comentarios' });
    res.json(comments);
  });
});

// Agregar comentario (requiere autenticación)
router.post('/:id/comments',
  authenticateToken,
  [
    body('content').trim().notEmpty().withMessage('El comentario no puede estar vacío')
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { content } = req.body;

    db.run(
      'INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)',
      [req.params.id, req.user.id, content],
      function(err) {
        if (err) return res.status(500).json({ error: 'Error al crear comentario' });
        res.status(201).json({
          message: 'Comentario creado',
          comment: { id: this.lastID, content }
        });
      }
    );
  }
);

// Actualizar un post (requiere autenticación)
router.put('/:id',
  authenticateToken,
  [
    body('title').trim().notEmpty().withMessage('El título es requerido'),
    body('content').trim().notEmpty().withMessage('El contenido es requerido'),
    body('category').trim().notEmpty().withMessage('La categoría es requerida')
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, content, category, image_gradient } = req.body;

    // Verificar que el post existe y que el usuario es el autor
    db.get('SELECT * FROM posts WHERE id = ? AND author_id = ?', [req.params.id, req.user.id], (err, post) => {
      if (err) return res.status(500).json({ error: 'Error del servidor' });
      if (!post) return res.status(404).json({ error: 'Post no encontrado o no tienes permiso' });

      // Actualizar el post
      db.run(
        'UPDATE posts SET title = ?, content = ?, category = ?, image_gradient = ? WHERE id = ?',
        [title, content, category, image_gradient, req.params.id],
        function(err) {
          if (err) return res.status(500).json({ error: 'Error al actualizar post' });
          res.json({
            message: 'Post actualizado exitosamente',
            post: { id: req.params.id, title, content, category }
          });
        }
      );
    });
  }
);

// Eliminar un post (requiere autenticación)
router.delete('/:id',
  authenticateToken,
  (req, res) => {
    db.get('SELECT * FROM posts WHERE id = ? AND author_id = ?', [req.params.id, req.user.id], (err, post) => {
      if (err) return res.status(500).json({ error: 'Error del servidor' });
      if (!post) return res.status(404).json({ error: 'Post no encontrado o no tienes permiso' });

      db.run('DELETE FROM posts WHERE id = ?', [req.params.id], function(err) {
        if (err) return res.status(500).json({ error: 'Error al eliminar post' });
        res.json({ message: 'Post eliminado exitosamente' });
      });
    });
  }
);

module.exports = router;