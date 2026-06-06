const express = require('express');
const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const db = require('../database');
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'tu-secreto-super-seguro-cambialo';
const router = express.Router();

// Configurar estrategia de GitHub
passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: process.env.GITHUB_CALLBACK_URL,
    scope: ['user:email']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Obtener email del perfil o hacer una petición adicional
      let email = null;
      
      if (profile.emails && profile.emails.length > 0) {
        email = profile.emails[0].value;
      } else {
        // Si no hay email público, hacer petición a la API de GitHub
        const response = await fetch('https://api.github.com/user/emails', {
          headers: {
            'Authorization': `token ${accessToken}`,
            'User-Agent': 'BlogFlow-App'
          }
        });
        const emails = await response.json();
        if (emails && emails.length > 0) {
          const primaryEmail = emails.find(e => e.primary && e.verified);
          email = primaryEmail ? primaryEmail.email : emails[0].email;
        }
      }
      
      if (!email) {
        return done(new Error('No se pudo obtener el email de GitHub'));
      }
      
      const name = profile.displayName || profile.username || email.split('@')[0];
      
      db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
        if (err) return done(err);
        
        if (!user) {
          // Crear nuevo usuario
          db.run(
            'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
            [name, email, 'oauth-github-' + profile.id],
            function(err) {
              if (err) return done(err);
              const newUser = { id: this.lastID, name, email };
              return done(null, newUser);
            }
          );
        } else {
          return done(null, user);
        }
      });
    } catch (error) {
      return done(error);
    }
  }
));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

// Iniciar autenticación
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));

// Callback
router.get('/github/callback',
  passport.authenticate('github', { session: false, failureRedirect: '/login.html' }),
  (req, res) => {
const token = jwt.sign(
  { id: req.user.id, email: req.user.email, role: req.user.role },
  JWT_SECRET,
  { expiresIn: '24h' }
);
    
    res.redirect(`/?token=${token}&user=${encodeURIComponent(JSON.stringify(req.user))}`);
  }
);

module.exports = router;
