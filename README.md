<div align="center">
  <img src="https://img.shields.io/badge/status-active-brightgreen" alt="Status" />
  <img src="https://img.shields.io/badge/license-custom-blue" alt="License" />
  <img src="https://img.shields.io/badge/PRs-welcome-orange" alt="PRs Welcome" />
</div>

<br/>

<p align="center">
  <h1 align="center">🚀 TeamSync</h1>
  <p align="center">
    <strong>Advanced B2B Multi-Tenancy Project Management SaaS</strong>
    <br />
    A full-stack, production-grade project management platform built with the MERN stack.
    <br />
    <br />
    <a href="#-features"><strong>Explore Features</strong></a>
    ·
    <a href="#-getting-started"><strong>Quick Start</strong></a>
    ·
    <a href="#-tech-stack"><strong>Tech Stack</strong></a>
    ·
    <a href="#-api-routes"><strong>API Reference</strong></a>
  </p>
</p>

---

## 📋 Overview

**TeamSync** is a powerful, multi-tenant project management SaaS designed for B2B teams. It provides workspace management, role-based access control, real-time collaboration via Socket.IO, task tracking with priority/status workflows, project analytics, OAuth authentication (Google & GitHub), and much more.

Built with **TypeScript** end-to-end, TeamSync emphasizes code quality, type safety, and a modern developer experience.

---

## ✨ Features

### 🔐 Authentication & Security
- **Multi-provider OAuth** — Sign in with Google, GitHub, or Email/Password
- **Session-based auth** — Secure cookie sessions with Passport.js
- **Password reset flow** — Forgot/reset password via email (Nodemailer)
- **Role-based access control** — Owner, Admin, and Member roles with granular permissions
- **Input validation** — Zod schemas on every endpoint

### 🏢 Workspace Management
- Create, edit, and delete workspaces
- Invite members via invite codes with optional passwords
- Role assignment & member management
- Automatic workspace creation on signup
- Switch between multiple workspaces

### 📊 Projects & Tasks
- Create projects with custom emoji, name, and description
- Full task CRUD with title, description, priority, status, and assignee
- Task status workflow: Backlog → To Do → In Progress → In Review → Done
- Priority levels: Low, Medium, High, Urgent
- Advanced filtering: by status, priority, assignee, keyword, due date
- Paginated task listing with server-side sorting

### 📈 Analytics & Dashboard
- **Workspace-level analytics**: total tasks, overdue, completed, priority & status breakdowns, task velocity trends (14-day chart), tasks-by-project progress
- **Project-level analytics**: same deep stats scoped to a single project
- **Team progress overview**: per-member task completion rates
- Animated charts with SVG donut, bar, and line charts (Framer Motion + custom SVG)
- Live-updating dashboard with auto-refresh

### 💬 Real-Time Collaboration
- **WebSocket-powered** live updates via Socket.IO
- **Chat** — workspace-wide messaging
- **Updates** — share progress updates, blockers, and status
- **Member progress tracking** — see who's working on what
- **Auto-scoped rooms** — join/leave workspace channels

### 👥 Role System & Permissions
| Permission | Owner | Admin | Member |
|---|---|---|---|
| Create/Delete Workspace | ✅ | ❌ | ❌ |
| Manage Workspace Settings | ✅ | ✅ | ❌ |
| Add/Remove Members | ✅ | ✅ | ❌ |
| Change Member Roles | ✅ | ✅ | ❌ |
| Create/Edit/Delete Projects | ✅ | ✅ | ✅ |
| Create/Edit/Delete Tasks | ✅ | ✅ | ✅ |
| View Only | ✅ | ✅ | ✅ |

### 🎨 Frontend Highlights
- **Shadcn UI** + Tailwind CSS — beautiful, accessible component library
- **Framer Motion** — smooth animations, micro-interactions, spring transitions
- **React Query (TanStack)** — server state management, caching, auto-refetch
- **React Hook Form** + Zod — performant form validation
- **Recharts** — responsive analytics charts
- **Responsive design** — mobile-first, works on all screen sizes
- **Dark mode** — built-in theme toggle

---

## 🛠️ Tech Stack

### Backend
| Technology | Purpose |
|---|---|
| **Node.js** + **Express** | Server runtime & web framework |
| **TypeScript** | Type safety across the stack |
| **MongoDB** + **Mongoose** | Database & ODM with transaction support |
| **Passport.js** | Authentication strategies (local, Google OAuth 2.0, GitHub OAuth) |
| **cookie-session** | Lightweight session management |
| **Socket.IO** | Real-time bidirectional event communication |
| **Zod** | Request validation & parsing |
| **Nodemailer** | Password reset email delivery |
| **Bcrypt** | Password hashing |

### Frontend
| Technology | Purpose |
|---|---|
| **React 18** | UI library |
| **TypeScript** | Type-safe components |
| **Vite** | Build tool & dev server |
| **Tailwind CSS** | Utility-first styling |
| **Shadcn UI** / Radix UI | Accessible, composable UI primitives |
| **Framer Motion** | Declarative animations |
| **TanStack React Query** | Server state & caching |
| **React Router v7** | Client-side routing |
| **React Hook Form** | Performant forms |
| **Zustand** | Lightweight client state |
| **Recharts** | Responsive charts |
| **Socket.IO Client** | Real-time communication |
| **nuqs** | URL query state management |

### DevOps & Tooling
| Technology | Purpose |
|---|---|
| **Docker** + **Docker Compose** | Local MongoDB container |
| **ts-node-dev** | Hot-reloading TypeScript development |
| **ESLint** | Code linting |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** >= 18.x
- **npm** >= 9.x or **pnpm** / **yarn**
- **Docker** (optional — for local MongoDB)

### 1. Clone & Install

```bash
git clone https://github.com/H4rshalshah/TeamSync.git
cd TeamSync

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 2. Start MongoDB (two options)

**Option A — Docker (recommended):**
```bash
cd ..
docker compose up -d
```

**Option B — Local MongoDB:**
Ensure `mongod` is running on `localhost:27017`.

### 3. Configure Environment Variables

Create `backend/.env`:

```env
# Server
PORT=8000
NODE_ENV=development
BASE_PATH=/api

# MongoDB
MONGO_URI="mongodb://127.0.0.1:27017/teamsync_db"

# Session
SESSION_SECRET="your-session-secret-change-me"
SESSION_EXPIRES_IN="1d"

# Google OAuth (optional — for Google Sign-In)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GOOGLE_CALLBACK_URL="http://localhost:8000/api/auth/google/callback"

# GitHub OAuth (optional — for GitHub Sign-In)
GITHUB_CLIENT_ID=""
GITHUB_CLIENT_SECRET=""
GITHUB_CALLBACK_URL="http://localhost:8000/api/auth/github/callback"

# SMTP (optional — for password reset emails)
SMTP_HOST=""
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASS=""
SMTP_FROM="Team Sync <no-reply@teamsync.local>"

# Frontend
FRONTEND_ORIGIN="http://localhost:3000"
FRONTEND_GOOGLE_CALLBACK_URL="http://localhost:3000/google/callback"
```

### 4. Seed Roles (one-time)

```bash
cd backend
npm run seed
```

### 5. Run the Application

```bash
# Terminal 1 — Backend (starts on port 8000)
cd backend
npm run dev

# Terminal 2 — Frontend (starts on port 3000)
cd client
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🧪 Local Demo Mode

TeamSync includes a **local demo mode** for testing without a database. Set `LOCAL_DEMO_MODE=true` in your `.env`:

```env
LOCAL_DEMO_MODE=true
```

This runs a mock server with seeded demo data — perfect for exploring the UI without setting up MongoDB.

---

## 📡 API Reference

### Authentication
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register with email & password |
| POST | `/api/auth/login` | Sign in with email & password |
| POST | `/api/auth/logout` | Sign out (clear session) |
| GET | `/api/auth/google` | Google OAuth login |
| GET | `/api/auth/google/callback` | Google OAuth callback |
| GET | `/api/auth/github` | GitHub OAuth login |
| GET | `/api/auth/github/callback` | GitHub OAuth callback |
| POST | `/api/auth/forgot-password` | Request password reset email |
| POST | `/api/auth/reset-password/:token` | Reset password with token |
| GET | `/api/auth/username/:name` | Check username availability |
| GET | `/api/auth/email/:email` | Check email availability |

### User
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/user/me` | Get current user profile |
| PUT | `/api/user/profile` | Update profile (name, email, password) |
| PUT | `/api/user/profile/photo` | Update profile picture URL |

### Workspaces
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/workspace` | Create a workspace |
| GET | `/api/workspace` | List user's workspaces |
| GET | `/api/workspace/:id` | Get workspace details + members |
| PUT | `/api/workspace/:id` | Update workspace |
| DELETE | `/api/workspace/:id` | Delete workspace (owner only) |
| GET | `/api/workspace/:id/members` | Get workspace members |
| PUT | `/api/workspace/:id/members/role` | Change member role |
| GET | `/api/workspace/:id/analytics` | Get workspace analytics |

### Invites
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/member/workspace/:inviteCode/join` | Join workspace via invite |
| POST | `/api/member/workspace/:inviteCode/validate` | Validate invite code/password |

### Projects
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/workspace/:workspaceId/project` | Create project |
| GET | `/api/workspace/:workspaceId/project` | List projects (paginated) |
| GET | `/api/workspace/:workspaceId/project/:id` | Get project details |
| PUT | `/api/workspace/:workspaceId/project/:id` | Update project |
| DELETE | `/api/workspace/:workspaceId/project/:id` | Delete project |
| GET | `/api/workspace/:workspaceId/project/:id/analytics` | Get project analytics |

### Tasks
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/workspace/:workspaceId/project/:projectId/task` | Create task |
| GET | `/api/workspace/:workspaceId/task` | List tasks (filtered, paginated) |
| GET | `/api/workspace/:workspaceId/project/:projectId/task/:id` | Get task details |
| PUT | `/api/workspace/:workspaceId/project/:projectId/task/:id` | Update task |
| DELETE | `/api/workspace/:workspaceId/task/:id` | Delete task |

### Collaboration (Real-Time)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/workspace/:workspaceId/collaboration` | Get updates + chat + member progress |
| POST | `/api/workspace/:workspaceId/collaboration` | Post update or chat message |
| DELETE | `/api/workspace/:workspaceId/collaboration/:entryId` | Delete an entry |
| DELETE | `/api/workspace/:workspaceId/collaboration/batch` | Batch delete by time window |
| DELETE | `/api/workspace/:workspaceId/members/:memberUserId` | Remove workspace member |

---

## 📁 Project Structure

```
TeamSync/
├── backend/
│   ├── src/
│   │   ├── config/          # App, database, HTTP, Passport config
│   │   ├── controllers/     # Route handlers
│   │   ├── enums/           # Shared constants & types
│   │   ├── middlewares/      # Auth, error handling, async wrapper
│   │   ├── models/          # Mongoose schemas
│   │   ├── routes/          # Express route definitions
│   │   ├── seeders/         # Role seed script
│   │   ├── services/        # Business logic layer
│   │   ├── socket/          # Socket.IO setup & events
│   │   ├── utils/           # Helpers (bcrypt, mailer, role guard, etc.)
│   │   └── validation/      # Zod validation schemas
│   └── package.json
│
├── client/
│   ├── src/
│   │   ├── components/      # UI components (Shadcn, workspace, auth, etc.)
│   │   ├── context/         # Auth, theme, query, socket providers
│   │   ├── hooks/           # Custom React hooks (API, dialogs, permissions)
│   │   ├── layout/          # App layouts (authenticated, base)
│   │   ├── lib/             # API client, helpers, utilities
│   │   ├── page/            # Route pages (auth, workspace, errors, etc.)
│   │   ├── routes/          # Route configuration & guards
│   │   └── types/           # TypeScript type definitions
│   └── package.json
│
├── docker-compose.yml       # MongoDB container
└── README.md
```

---

## 🧑‍💻 Development

### Scripts

**Backend:**
```bash
npm run dev       # Start dev server with hot-reload
npm run build     # Build for production
npm run start     # Run production build
npm run seed      # Seed roles into database
```

**Frontend:**
```bash
npm run dev       # Vite dev server on :3000
npm run build     # TypeScript check + Vite build
npm run preview   # Preview production build locally
npm run lint      # ESLint check
```

### Architecture Notes

- **Multi-tenancy** is handled via workspace-scoped IDs — every model (project, task, member) references a workspace
- **Transactions**: Mongoose transactions are used for critical user/workspace creation, with graceful fallback when running on a standalone MongoDB instance
- **Session auth**: Server uses `cookie-session` with Passport.js — no JWT tokens, purely session-based
- **Socket.IO** rooms follow the pattern `workspace:<workspaceId>` for scoped real-time events
- **Permissions** are enforced at the controller level via a `roleGuard` utility that checks against the workspace member's role

---

## 🙌 Contributing

Contributions are welcome! If you'd like to contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under a custom license — see the [TECHWITHEMMA-LICENSE.md](./TECHWITHEMMA-LICENSE.md) file for details.

---

## 👤 Author

**H4rshal Shah**  
[![GitHub](https://img.shields.io/badge/GitHub-H4rshalshah-181717?logo=github)](https://github.com/H4rshalshah)  
📧 h4rshal.workspacea@gmail.com

---

<p align="center">
  <strong>⭐ If you find this project useful, please consider giving it a star!</strong>
  <br />
  <sub>Built with ❤️ using the MERN stack</sub>
</p>
