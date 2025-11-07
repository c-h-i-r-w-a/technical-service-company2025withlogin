// server.js
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const db = new sqlite3.Database('./users.db');

// === 1. MIDDLEWARE STATIQUE (doit être AVANT la protection) ===
// Sert TOUS les fichiers du dossier principal (index.html, register.html, style.css)
app.use(express.static(__dirname));

// Sert le site principal dans /site
app.use('/site', express.static(path.join(__dirname, 'public')));

app.use(bodyParser.urlencoded({ extended: true }));

// === 2. CRÉATION DE LA BASE ===
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
  )`);
});

// === 3. ROUTES DE LOGIN ===
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'register.html'));
});

// === 4. INSCRIPTION ===
app.post('/register', (req, res) => {
  const { username, password } = req.body;
  db.run(`INSERT INTO users (username, password) VALUES (?, ?)`, [username, password], function(err) {
    if (err) {
      res.send(`
        <div style="text-align:center; padding:50px; font-family:Arial;">
          <h3 style="color:red;">Error : Username already taken!</h3>
          <a href="/register">Retry</a> | <a href="/">Connexion</a>
        </div>
      `);
    } else {
      res.redirect('/site/index.html');
    }
  });
});

// === 5. CONNEXION ===
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  db.get(`SELECT * FROM users WHERE username = ? AND password = ?`, [username, password], (err, row) => {
    if (row) {
      res.redirect('/site/index.html');
    } else {
      res.send(`
        <div style="text-align:center; padding:50px; font-family:Arial;">
          <h3 style="color:red;">Incorrect login details!</h3>
          <a href="/">Retry</a> | <a href="/register">Register</a>
        </div>
      `);
    }
  });
});

// === 6. PROTECTION INTELLIGENTE : uniquement les fichiers HTML du site ===
app.use('/site', (req, res, next) => {
  // Si c'est un fichier statique (CSS, JS, image, etc.) → laisser passer
  const ext = path.extname(req.path).toLowerCase();
  if (['.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.mp4', '.webp'].includes(ext)) {
    return next();
  }

  // Sinon, c'est probablement une page HTML → rediriger vers login
  res.redirect('/');
});

// === 7. DÉMARRAGE ===
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Serveur démarré sur le port ${port}`);
  console.log('Serveur démarré sur http://localhost:3000');
  console.log('CSS, images, vidéos → TOUT CHARGE !');
  console.log('Liens login ↔ inscription → FONCTIONNENT !');
});