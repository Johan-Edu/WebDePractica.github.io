const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');
const { body, validationResult } = require('express-validator');

const router = express.Router();
const JWT_SECRET = 'tu-secreto-super-seguro-cambialo'; // Cambia esto en producción

// Registro
router.post('/register',
  [
    body('name').trim().notEmpty().withMessage('El nombre es requerido'),
    body('email').isEmail().withMessage('Email inválido'),
    body('password').isLength({ min: 8 }).withMessage('Mínimo 8 caracteres')
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    // Verificar si el email ya existe
    db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
      if (err) return res.status(500).json({ error: 'Error del servidor' });
      if (user) return res.status(400).json({ error: 'El email ya está registrado' });

      // Hashear contraseña
      bcrypt.hash(password, 10, (err, hashedPassword) => {
        if (err) return res.status(500).json({ error: 'Error al procesar contraseña' });

        // Insertar usuario
        db.run(
          'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
          [name, email, hashedPassword],
          function(err) {
            if (err) return res.status(500).json({ error: 'Error al crear usuario' });

            // Generar token
            const token = jwt.sign(
              { id: this.lastID, email },
              JWT_SECRET,
              { expiresIn: '7d' }
            );

            res.status(201).json({
              message: 'Usuario creado exitosamente',
              token,
              user: { id: this.lastID, name, email }
            });
          }
        );
      });
    });
  }
);

// Login
router.post('/login',
  [
    body('email').isEmail().withMessage('Email inválido'),
    body('password').notEmpty().withMessage('La contraseña es requerida')
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
      if (err) return res.status(500).json({ error: 'Error del servidor' });
      if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });

      // Verificar contraseña
      bcrypt.compare(password, user.password, (err, isMatch) => {
        if (err) return res.status(500).json({ error: 'Error al verificar contraseña' });
        if (!isMatch) return res.status(401).json({ error: 'Credenciales inválidas' });

        // Generar token
        const token = jwt.sign(
          { id: user.id, email: user.email },
          JWT_SECRET,
          { expiresIn: '7d' }
        );

        res.json({
          message: 'Login exitoso',
          token,
          user: { id: user.id, name: user.name, email: user.email }
        });
      });
    });
  }
);

// Middleware para proteger rutas
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Token requerido' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido' });
    req.user = user;
    next();
  });
};

// Obtener perfil del usuario
router.get('/profile', authenticateToken, (req, res) => {
  db.get('SELECT id, name, email, created_at FROM users WHERE id = ?', [req.user.id], (err, user) => {
    if (err) return res.status(500).json({ error: 'Error del servidor' });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(user);
  });
});

// Actualizar perfil
router.put('/profile', authenticateToken, (req, res) => {
  const { name, email } = req.body;

  db.run(
    'UPDATE users SET name = ?, email = ? WHERE id = ?',
    [name, email, req.user.id],
    function(err) {
      if (err) return res.status(500).json({ error: 'Error al actualizar' });
      res.json({ message: 'Perfil actualizado', user: { id: req.user.id, name, email } });
    }
  );
});

// Cambiar contraseña
router.put('/password', authenticateToken, (req, res) => {
  const { currentPassword, newPassword } = req.body;

  db.get('SELECT password FROM users WHERE id = ?', [req.user.id], (err, user) => {
    if (err) return res.status(500).json({ error: 'Error del servidor' });
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    bcrypt.compare(currentPassword, user.password, (err, isMatch) => {
      if (err) return res.status(500).json({ error: 'Error al verificar contraseña' });
      if (!isMatch) return res.status(401).json({ error: 'Contraseña actual incorrecta' });

      bcrypt.hash(newPassword, 10, (err, hashedPassword) => {
        if (err) return res.status(500).json({ error: 'Error al procesar contraseña' });

        db.run(
          'UPDATE users SET password = ? WHERE id = ?',
          [hashedPassword, req.user.id],
          function(err) {
            if (err) return res.status(500).json({ error: 'Error al actualizar' });
            res.json({ message: 'Contraseña actualizada' });
          }
        );
      });
    });
  });
});

const nodemailer = require('nodemailer');

// Configurar transporter de email (para desarrollo usamos Ethereal)
const createTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
      user: 'tu-email-test@ethereal.email',  // ← Reemplazar con cuenta real de Ethereal
      pass: 'tu-password'
    }
  });
  
  // O para producción (Gmail):
  // return nodemailer.createTransport({
  //   service: 'gmail',
  //   auth: {
  //     user: process.env.EMAIL_USER,
  //     pass: process.env.EMAIL_PASS
  //   }
  // });
};

// Solicitar recuperación de contraseña
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email es requerido' });
  }

  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (err) return res.status(500).json({ error: 'Error del servidor' });
    
    // Si no existe el usuario, no decimos nada (seguridad)
    if (!user) {
      return res.json({ message: 'Si el email existe, se ha enviado un enlace de recuperación' });
    }

    // Generar token único
    const crypto = require('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // 1 hora

    // Guardar token en la base de datos
    db.run(
      'UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE id = ?',
      [resetToken, resetTokenExpiry, user.id],
      async (err) => {
        if (err) return res.status(500).json({ error: 'Error al generar token' });

        // Crear enlace de recuperación
     const frontendUrl = process.env.CODESPACE_NAME ? 
      `https://${process.env.CODESPACE_NAME}-3000.app.github.dev` : 
  `   ${req.protocol}://${req.get('host')}`;
  
  const baseUrl = req.headers['x-forwarded-proto'] ? `${req.headers['x-forwarded-proto']}://${req.headers['x-forwarded-host']}` : `${req.protocol}://${req.get('host')}`;
const resetLink = `${baseUrl}/reset-password.html?token=${resetToken}`;

        // Configurar email
        const transporter = createTransporter();
        
        const mailOptions = {
          from: 'BlogFlow <noreply@blogflow.com>',
          to: user.email,
          subject: 'Recuperación de contraseña - BlogFlow',
          html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; background: #f4f4f4;">
              <div style="max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px;">
                <h1 style="color: #3b82f6;">BlogFlow</h1>
                <h2>Recuperación de contraseña</h2>
                <p>Hola ${user.name},</p>
                <p>Has solicitado restablecer tu contraseña. Haz clic en el botón de abajo:</p>
                <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">
                  Restablecer contraseña
                </a>
                <p>O copia este enlace en tu navegador:</p>
                <p style="word-break: break-all; color: #666;">${resetLink}</p>
                <p style="color: #999; font-size: 12px; margin-top: 30px;">
                  Este enlace expira en 1 hora. Si no solicitaste esto, ignora este email.
                </p>
              </div>
            </div>
          `
        };

        try {
          // Enviar email
          await transporter.sendMail(mailOptions);
          console.log('✅ Email de recuperación enviado a:', user.email);
          
          res.json({ message: 'Si el email existe, se ha enviado un enlace de recuperación' });
        } catch (error) {
          console.error('Error enviando email:', error);
          // Para desarrollo: mostrar el link en consola
          console.log('🔗 Enlace de recuperación:', resetLink);
          res.json({ 
            message: 'Enlace de recuperación generado (revisa la consola del backend)',
            resetLink: process.env.NODE_ENV === 'development' ? resetLink : undefined
          });
        }
      }
    );
  });
});

// Restablecer contraseña
router.post('/reset-password', (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Token y nueva contraseña son requeridos' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
  }

  const bcrypt = require('bcryptjs');

  db.get(
    'SELECT * FROM users WHERE reset_token = ? AND reset_token_expiry > ?',
    [token, Date.now()],
    async (err, user) => {
      if (err) return res.status(500).json({ error: 'Error del servidor' });
      if (!user) {
        return res.status(400).json({ error: 'Token inválido o expirado' });
      }

      // Hashear nueva contraseña
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Actualizar contraseña y limpiar token
      db.run(
        'UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?',
        [hashedPassword, user.id],
        (err) => {
          if (err) return res.status(500).json({ error: 'Error al actualizar contraseña' });
          res.json({ message: 'Contraseña actualizada exitosamente' });
        }
      );
    }
  );
});

module.exports = router;
