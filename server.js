// ==================== FRACTURED UNIVERSE BACKEND API ====================
// Complete Node.js/Express backend for production deployment
// Install: npm install express bcrypt jsonwebtoken cors body-parser sqlite3

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'CHANGE-THIS-SECRET-IN-PRODUCTION';

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

// Database
const db = new sqlite3.Database('./fractured_universe.db');

// Create tables
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        race TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        last_login INTEGER
    )`);
    
    db.run(`CREATE TABLE IF NOT EXISTS game_states (
        user_id INTEGER PRIMARY KEY,
        state_json TEXT NOT NULL,
        last_updated INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
    )`);
    
    db.run(`CREATE TABLE IF NOT EXISTS chat_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender_id INTEGER NOT NULL,
        channel TEXT NOT NULL,
        message TEXT NOT NULL,
        timestamp INTEGER NOT NULL
    )`);
    
    db.run(`CREATE TABLE IF NOT EXISTS trade_offers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        seller_id INTEGER NOT NULL,
        offering_json TEXT NOT NULL,
        requesting_json TEXT NOT NULL,
        active INTEGER DEFAULT 1,
        created_at INTEGER NOT NULL
    )`);
});

// Auth middleware
function auth(req, res, next) {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.sendStatus(401);
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

// ==================== ROUTES ====================

// Register
app.post('/api/auth/register', async (req, res) => {
    const { username, email, password, race } = req.body;
    
    if (!username || !email || !password || !race) {
        return res.status(400).json({ error: 'All fields required' });
    }
    
    const password_hash = await bcrypt.hash(password, 10);
    
    db.run(
        `INSERT INTO users (username, email, password_hash, race, created_at) VALUES (?, ?, ?, ?, ?)`,
        [username, email, password_hash, race, Date.now()],
        function(err) {
            if (err) return res.status(400).json({ error: 'Username or email exists' });
            
            const initialState = {
                resources: { credits: 50000, metal: 25000, he3: 10000, food: 15000 },
                planets: [], fleets: [], research: { completed: [], queue: [] },
                diplomacy: { allies: [], pending: [] }, missions: [], notifications: []
            };
            
            db.run(
                `INSERT INTO game_states (user_id, state_json, last_updated) VALUES (?, ?, ?)`,
                [this.lastID, JSON.stringify(initialState), Date.now()]
            );
            
            const token = jwt.sign({ id: this.lastID, username, race }, JWT_SECRET, { expiresIn: '7d' });
            res.json({ token, user: { id: this.lastID, username, email, race } });
        }
    );
});

// Login
app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    
    db.get(`SELECT * FROM users WHERE username = ?`, [username], async (err, user) => {
        if (err || !user) return res.status(401).json({ error: 'Invalid credentials' });
        
        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
        
        db.run(`UPDATE users SET last_login = ? WHERE id = ?`, [Date.now(), user.id]);
        
        const token = jwt.sign({ id: user.id, username: user.username, race: user.race }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, user: { id: user.id, username: user.username, email: user.email, race: user.race } });
    });
});

// Get game state
app.get('/api/game/state', auth, (req, res) => {
    db.get(`SELECT state_json FROM game_states WHERE user_id = ?`, [req.user.id], (err, row) => {
        if (err || !row) return res.status(404).json({ error: 'State not found' });
        res.json({ state: JSON.parse(row.state_json) });
    });
});

// Save game state
app.post('/api/game/state', auth, (req, res) => {
    db.run(
        `UPDATE game_states SET state_json = ?, last_updated = ? WHERE user_id = ?`,
        [JSON.stringify(req.body.state), Date.now(), req.user.id],
        (err) => {
            if (err) return res.status(500).json({ error: 'Save failed' });
            res.json({ success: true });
        }
    );
});

// Leaderboard
app.get('/api/game/leaderboard', (req, res) => {
    db.all(
        `SELECT u.username, u.race, gs.state_json FROM users u JOIN game_states gs ON u.id = gs.user_id LIMIT 100`,
        (err, rows) => {
            if (err) return res.status(500).json({ error: 'Failed' });
            
            const players = rows.map(row => {
                const state = JSON.parse(row.state_json);
                const score = (state.planets || []).length * 1000 + 
                             (state.research?.completed || []).length * 500;
                return { username: row.username, race: row.race, score };
            }).sort((a, b) => b.score - a.score);
            
            res.json({ players });
        }
    );
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
