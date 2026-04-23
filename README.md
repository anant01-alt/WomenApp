# 🛡️ SafeGuard — AI-Powered Women Safety & Emergency Response System

A full-stack MERN web application to enhance women's safety through real-time SOS alerts, GPS tracking, emergency contacts, AI-based threat detection, and live chat.

---

## 📁 Project Structure

```
womensafety/
├── backend/                    # Node.js + Express + MongoDB
│   ├── config/
│   │   └── db.js               # MongoDB connection
│   ├── controllers/
│   │   ├── authController.js   # Register, Login, Me
│   │   ├── userController.js   # Profile, Contacts, Location
│   │   ├── sosController.js    # SOS trigger, resolve, history
│   │   ├── chatController.js   # Messages, rooms
│   │   └── adminController.js  # Admin dashboard, user/alert mgmt
│   ├── middleware/
│   │   ├── authMiddleware.js   # JWT protect + adminOnly
│   │   └── errorMiddleware.js  # Global error handler
│   ├── models/
│   │   ├── User.js             # User schema + bcrypt
│   │   ├── EmergencyContact.js # Trusted contacts schema
│   │   ├── Alert.js            # SOS alert schema
│   │   ├── Message.js          # Chat message schema
│   │   └── LocationLog.js      # GPS history schema
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   ├── sosRoutes.js
│   │   ├── chatRoutes.js
│   │   └── adminRoutes.js
│   ├── socket/
│   │   └── socketManager.js    # Socket.IO: location, chat, SOS events
│   ├── seed.js                 # Database seed script
│   ├── server.js               # Entry point
│   ├── package.json
│   └── .env.example
│
├── frontend/                   # React.js + CSS Modules
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── components/
│       │   ├── common/
│       │   │   ├── Sidebar.js          # Desktop sidebar nav
│       │   │   ├── MobileNav.js        # Mobile bottom nav
│       │   │   └── LoadingScreen.js
│       │   └── sos/
│       │       └── EmergencyBanner.js  # Active SOS top banner
│       ├── context/
│       │   ├── AuthContext.js          # Global auth state
│       │   └── SOSContext.js           # Emergency state + GPS tracking
│       ├── pages/
│       │   ├── LoginPage.js
│       │   ├── RegisterPage.js
│       │   ├── DashboardPage.js        # Stats + AI assessment + quick actions
│       │   ├── SOSPage.js              # Hold-to-SOS button
│       │   ├── MapPage.js              # Google Maps / OpenStreetMap
│       │   ├── ChatPage.js             # Real-time messaging
│       │   ├── ContactsPage.js         # CRUD emergency contacts
│       │   ├── HistoryPage.js          # Incident log
│       │   ├── ProfilePage.js          # Edit profile + password
│       │   ├── AdminPage.js            # Admin dashboard
│       │   └── NotFoundPage.js
│       ├── services/
│       │   ├── api.js                  # Axios + all API calls
│       │   └── socket.js               # Socket.IO client
│       ├── App.js                      # Routes + layout
│       ├── index.js
│       ├── index.css                   # Design system (CSS variables)
│       └── .env.example
│
└── package.json                # Root — run both together
```

---

## ⚡ Quick Start

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- npm or yarn

---

### Step 1 — Clone & Install

```bash
# Clone the project
git clone <your-repo-url>
cd womensafety

# Install all dependencies (backend + frontend)
npm run install:all
```

Or manually:
```bash
cd backend && npm install
cd ../frontend && npm install
```

---

### Step 2 — Configure Environment Variables

**Backend** (`backend/.env`):
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/womensafety
JWT_SECRET=your_super_secret_key_change_in_production
JWT_EXPIRE=7d
CLIENT_URL=http://localhost:3000

# Optional: Twilio for real SMS
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+1234567890
```

**Frontend** (`frontend/.env`):
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
REACT_APP_GOOGLE_MAPS_KEY=your_google_maps_api_key
```

> 💡 **No Google Maps key?** The app falls back to OpenStreetMap automatically.

---

### Step 3 — Seed the Database

```bash
npm run seed
# or: cd backend && node seed.js
```

Creates:
| Role  | Email                  | Password  |
|-------|------------------------|-----------|
| User  | demo@safeguard.com     | demo123   |
| Admin | admin@safeguard.com    | admin123  |

---

### Step 4 — Run the App

```bash
# Run both backend + frontend together
npm run dev
```

Or separately:
```bash
# Terminal 1 — Backend (port 5000)
cd backend && npm run dev

# Terminal 2 — Frontend (port 3000)
cd frontend && npm start
```

Open: **http://localhost:3000**

---

## 🌐 API Reference

### Auth
| Method | Endpoint             | Access  | Description          |
|--------|----------------------|---------|----------------------|
| POST   | /api/auth/register   | Public  | Register user        |
| POST   | /api/auth/login      | Public  | Login + get token    |
| GET    | /api/auth/me         | Private | Get current user     |
| PUT    | /api/auth/password   | Private | Change password      |

### Users
| Method | Endpoint                   | Access  | Description              |
|--------|----------------------------|---------|--------------------------|
| PUT    | /api/users/profile         | Private | Update profile           |
| GET    | /api/users/contacts        | Private | List emergency contacts  |
| POST   | /api/users/contacts        | Private | Add contact              |
| PUT    | /api/users/contacts/:id    | Private | Update contact           |
| DELETE | /api/users/contacts/:id    | Private | Remove contact           |
| POST   | /api/users/location        | Private | Update GPS location      |
| GET    | /api/users/location-history| Private | Get location logs        |

### SOS
| Method | Endpoint               | Access  | Description              |
|--------|------------------------|---------|--------------------------|
| POST   | /api/sos/trigger       | Private | Trigger SOS alert        |
| GET    | /api/sos/active        | Private | Get active alert         |
| GET    | /api/sos/history       | Private | Get alert history        |
| GET    | /api/sos/:id           | Private | Get single alert         |
| PUT    | /api/sos/:id/location  | Private | Update alert location    |
| PUT    | /api/sos/:id/resolve   | Private | Resolve/cancel alert     |

### Chat
| Method | Endpoint          | Access  | Description        |
|--------|-------------------|---------|--------------------|
| GET    | /api/chat/rooms   | Private | Get user's rooms   |
| GET    | /api/chat/:room   | Private | Get room messages  |
| POST   | /api/chat/:room   | Private | Send a message     |

### Admin
| Method | Endpoint                        | Admin | Description           |
|--------|---------------------------------|-------|-----------------------|
| GET    | /api/admin/stats                | ✅    | Dashboard stats       |
| GET    | /api/admin/users                | ✅    | List all users        |
| PUT    | /api/admin/users/:id/toggle     | ✅    | Activate/deactivate   |
| GET    | /api/admin/alerts               | ✅    | List all alerts       |
| PUT    | /api/admin/alerts/:id/resolve   | ✅    | Resolve alert         |

---

## 🔌 Socket.IO Events

### Client → Server
| Event           | Payload                        | Description                  |
|-----------------|--------------------------------|------------------------------|
| location_update | { lat, lng, alertId }          | Send GPS position            |
| watch_user      | userId                         | Subscribe to user's location |
| unwatch_user    | userId                         | Unsubscribe                  |
| join_room       | roomId                         | Join a chat room             |
| leave_room      | roomId                         | Leave a chat room            |
| send_message    | { room, content, receiverId }  | Send chat message            |
| typing          | { room, isTyping }             | Typing indicator             |

### Server → Client
| Event            | Description                          |
|------------------|--------------------------------------|
| location_update  | Real-time GPS of a tracked user      |
| sos_triggered    | New SOS alert broadcast              |
| alert_resolved   | Alert status changed to resolved     |
| new_message      | New chat message in a room           |
| user_typing      | Typing indicator for a user          |
| user_online      | User came online                     |
| user_offline     | User went offline                    |

---

## ✨ Features

| Feature                  | Status | Details                                      |
|--------------------------|--------|----------------------------------------------|
| JWT Authentication       | ✅     | Register, login, protected routes            |
| User Dashboard           | ✅     | Stats, quick actions, AI assessment          |
| SOS Emergency Button     | ✅     | Hold-3s trigger, cancel, preset messages     |
| Emergency Contacts       | ✅     | Add/edit/delete up to 5 contacts             |
| Real-time GPS Tracking   | ✅     | Browser Geolocation + Socket.IO broadcast    |
| Google Maps Integration  | ✅     | Falls back to OpenStreetMap if no key        |
| Live Emergency Chat      | ✅     | Socket.IO, typing indicators, read receipts  |
| AI Safety Assessment     | ✅     | Time + location based risk scoring           |
| Incident History         | ✅     | Paginated, filterable alert log              |
| Mock SMS Alerts          | ✅     | Console log (Twilio-ready in production)     |
| Admin Panel              | ✅     | User mgmt, alert resolution, stats           |
| Responsive Design        | ✅     | Mobile nav + sidebar for desktop             |

---

## 🚀 Deployment

### Backend (e.g. Render / Railway)
1. Set all env vars from `.env.example`
2. Set `NODE_ENV=production`
3. Build command: `npm install`
4. Start command: `node server.js`

### Frontend (e.g. Vercel / Netlify)
1. Set `REACT_APP_API_URL` to your backend URL
2. Set `REACT_APP_SOCKET_URL` to your backend URL
3. Set `REACT_APP_GOOGLE_MAPS_KEY` (optional)
4. Build command: `npm run build`
5. Output directory: `build`

### MongoDB
Use **MongoDB Atlas** free tier for cloud hosting.  
Set `MONGO_URI=mongodb+srv://...` in backend env.

---

## 🔒 Security Features

- Passwords hashed with **bcrypt** (salt rounds: 12)
- **JWT** tokens with configurable expiry
- **Helmet.js** for HTTP security headers
- **Rate limiting** (200 req / 15 min per IP)
- **CORS** restricted to frontend origin
- Socket.IO connections authenticated via JWT

---

## 📦 Tech Stack

| Layer       | Technology                        |
|-------------|-----------------------------------|
| Frontend    | React 18, React Router 6          |
| Styling     | CSS Modules, CSS Variables        |
| State       | Context API (Auth + SOS)          |
| HTTP Client | Axios                             |
| Real-time   | Socket.IO (client + server)       |
| Backend     | Node.js, Express.js               |
| Database    | MongoDB with Mongoose             |
| Auth        | JWT + bcryptjs                    |
| Maps        | Google Maps API / OpenStreetMap   |
| SMS         | Twilio (mock by default)          |
| Fonts       | Syne + DM Sans (Google Fonts)     |

---

## 🆘 Emergency Helplines (India)

| Service                  | Number |
|--------------------------|--------|
| Women Helpline           | 1091   |
| Police                   | 100    |
| National Emergency       | 112    |
| Domestic Violence        | 181    |

---

*Built with ❤️ for women's safety.*
