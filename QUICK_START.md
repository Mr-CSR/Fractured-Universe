# FRACTURED UNIVERSE - Quick Start Guide

## 🚀 Get Your Game Running in 5 Minutes

### Option 1: Instant Demo (No Server Required)

1. Open `index.html` directly in your browser
2. Register a new account
3. Start playing immediately!

The game uses localStorage for data persistence, so you can play offline.

---

### Option 2: Full Production Setup

#### Prerequisites
- Node.js 14+ installed
- npm or yarn

#### Installation Steps

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env and set your JWT_SECRET

# 3. Create public folder and move game file
mkdir public
cp index.html public/

# 4. Start the server
npm start
```

Server will be running at `http://localhost:3000`

---

### Option 3: Deploy to Cloud

#### Netlify/Vercel (Frontend Only)
1. Upload `index.html` to Netlify or Vercel
2. Deploy - that's it!

#### Heroku (Full Stack)
```bash
# Create Heroku app
heroku create your-app-name

# Add buildpack
heroku buildpacks:set heroku/nodejs

# Deploy
git add .
git commit -m "Deploy Fractured Universe"
git push heroku main
```

#### DigitalOcean/AWS/GCP
1. Create a server instance (Ubuntu recommended)
2. Install Node.js
3. Upload your files
4. Run `npm install && npm start`
5. Use PM2 for process management: `pm2 start server.js`

---

## 🎮 Game Features

✅ **Complete MMO Experience**
- Real-time multiplayer (with backend)
- Persistent game world
- Player vs. Player combat
- Alliance system
- Trading marketplace

✅ **Strategic Gameplay**
- Galaxy exploration
- Planet colonization
- Fleet management
- Research progression
- Resource management

✅ **Social Features**
- Global chat
- Alliance chat
- Trade chat
- Leaderboards
- Diplomacy

---

## 📱 Responsive Design

The game automatically adapts to:
- Desktop (1920x1080+)
- Laptop (1366x768+)
- Tablet (768x1024)
- Mobile (375x667)

---

## 🔒 Security Notes

**IMPORTANT FOR PRODUCTION:**

1. Change `JWT_SECRET` in `.env` to a strong random string
2. Use HTTPS (Let's Encrypt is free)
3. Enable rate limiting (uncomment in server.js)
4. Set up proper CORS for your domain
5. Use environment variables, never commit secrets

---

## 🛠️ Customization

Want to modify the game? All key constants are easily editable:

**Resources:**
- Line ~144: Initial resource amounts
- Line ~410: Resource production rates

**Research:**
- Line ~169: Research tree
- Modify costs, times, and bonuses

**Ships:**
- Line ~XXX: Ship stats and costs
- Add new ship types easily

**UI Theme:**
- Line ~16-28: CSS color variables
- Change entire color scheme instantly

---

## 📊 Database Schema

The game uses SQLite by default, easily upgradable to PostgreSQL/MySQL:

- `users` - Player accounts
- `game_states` - Saved games
- `chat_messages` - Chat history
- `trade_offers` - Marketplace
- `alliances` - Diplomatic relations

---

## 🆘 Troubleshooting

**"Cannot find module" error:**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Database locked:**
```bash
rm fractured_universe.db
# Server will recreate it on next start
```

**Port already in use:**
```bash
# Change PORT in .env or:
PORT=4000 npm start
```

---

## 📞 Support

For issues, check the inline code comments - they explain every system in detail.

---

## 🎯 What's Next?

Consider adding:
- WebSocket for real-time updates
- Email notifications
- Password reset functionality
- Admin dashboard
- Mobile apps (React Native)
- Discord bot integration

The codebase is structured to make these additions straightforward!

---

**Enjoy building your space empire! 🚀**
