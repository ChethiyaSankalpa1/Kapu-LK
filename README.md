# Kapu LK — Sri Lanka Matrimonial Platform

A full-stack MERN (MongoDB, Express, React, Node.js) matrimonial web application built for Sri Lankan users, supporting English, Sinhala (සිංහල), and Tamil (தமிழ்).

---

## 📁 Project Structure

```
Kapu LK/
├── 📄 package.json          # Root monorepo workspace manager
├── 📄 .gitignore            # Root gitignore
├── 📄 README.md             # This file
│
├── 📁 client/               # React Frontend (Create React App + TailwindCSS)
│   ├── 📁 public/           # Static HTML, favicon, manifest
│   └── 📁 src/
│       ├── 📁 assets/              # Images, fonts, icons
│       ├── 📁 components/
│       │   ├── 📁 common/          # Shared UI (Navbar, Footer)
│       │   └── 📁 ui/              # Reusable components (ProfileCard, UserCard)
│       ├── 📁 context/             # React Context (AuthContext)
│       ├── 📁 hooks/               # Custom React hooks
│       ├── 📁 locales/             # i18n translation files (en, si, ta)
│       ├── 📁 pages/
│       │   ├── 📁 admin/           # Admin pages (AdminDashboard)
│       │   ├── 📁 auth/            # Auth pages (Login, Register, ForgotPassword, ResetPassword)
│       │   ├── 📁 public/          # Public pages (Home)
│       │   └── 📁 user/            # User pages (Dashboard, Profile, Users, etc.)
│       ├── 📁 routes/              # Route guard components (AdminRoute, PrivateRoute, UserRoute)
│       ├── 📁 services/            # API service layer (api.js with axios)
│       └── 📁 utils/               # Helper utilities
│
└── 📁 server/               # Express.js Backend API
    ├── 📁 config/           # Database & Cloudinary configuration
    ├── 📁 controllers/      # Business logic handlers
    ├── 📁 middleware/       # Auth middleware, file upload
    ├── 📁 models/           # Mongoose schemas
    ├── 📁 routes/           # Express API route definitions
    └── 📁 utils/            # Helper utilities (mailer, crypto, seeder)
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0
- MongoDB Atlas account (or local MongoDB)

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd kapu-lk

# Install all dependencies (root + client + server)
npm run install:all
```

### Environment Setup

**Server** — copy and fill in your values:
```bash
cp server/.env.example server/.env
```

**Client** — copy and fill in your values:
```bash
cp client/.env.example client/.env
```

### Running Locally

```bash
# Start both client and server simultaneously (from root)
npm run dev

# Or start individually:
npm run client   # React app on http://localhost:3000
npm run server   # Express API on http://localhost:5000
```

---

## 🌐 Deployment

### Frontend (Vercel / Netlify)
- Build command: `npm run build` (inside `/client`)
- Output directory: `client/build`
- Set `REACT_APP_API_URL` environment variable to your production API URL

### Backend (Railway / Render / VPS)
- Start command: `node server.js` (inside `/server`)
- Set all environment variables from `server/.env.example`

---

## 🔑 Key Features

- 🔐 JWT Authentication with roles (user/admin)
- 📱 Responsive design (mobile-first)
- 🌙 Dark mode support
- 🌍 Multi-language (English, Sinhala, Tamil)
- 👑 Premium membership system with bank transfer payment
- 💬 Real-time messaging between users
- 🔔 Notification system
- 🖼️ Cloudinary image uploads
- 🔗 Profile matching algorithm
- 🛡️ Admin dashboard with full user management

---

## 📄 License

Private — All rights reserved.
