// server.js
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const db = new sqlite3.Database('./users.db');

// === MIDDLEWARE ===
// 1. Sert TOUS les fichiers du dossier principal (login + CSS)
app.use(express.static(__dirname));

// 2. Sert le site principal dans /site
app.use('/site', express.static(path.join(__dirname, 'public')));

app.use(bodyParser.urlencoded({ extended: true }));

// === BASE DE DONNÉES ===
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
  )`);
});

// === ROUTES ===
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html')); // Page de connexion
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'register.html'));
});

// === INSCRIPTION ===
app.post('/register', (req, res) => {
  const { username, password } = req.body;
  db.run(`INSERT INTO users (username, password) VALUES (?, ?)`, [username, password], (err) => {
    if (err) {
      res.send('<h3 style="color:red;">Utilisateur existe déjà !</h3><a href="/register">Retour</a>');
    } else {
      res.redirect('/site/index.html');
    }
  });
});

// === CONNEXION ===
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  db.get(`SELECT * FROM users WHERE username = ? AND password = ?`, [username, password], (err, row) => {
    if (row) {
      res.redirect('/site/index.html');
    } else {
      res.send('<h3 style="color:red;">Mauvais identifiants !</h3><a href="/">Retour</a>');
    }
  });
});

// === PROTECTION ===
app.use('/site', (req, res, next) => {
  const ext = path.extname(req.path);
  if (['.css', '.js', '.png', '.jpg', '.mp4'].includes(ext)) {
    return next();
  }
  res.redirect('/');
});

// === PORT DYNAMIQUE (Render) ===
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Serveur en ligne sur le port ${port}`);
});
