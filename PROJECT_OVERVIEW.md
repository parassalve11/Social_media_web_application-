# Social Media Web App - Project Overview

## 🎯 Project Goal
A full-stack MERN social media application with secure authentication, real-time messaging, photo/video sharing, user interactions (follow, like, comment), and live notifications using WebSockets.

## 💻 Technologies Stack

### Backend
- **Runtime:** Node.js with Express.js
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT (Access & Refresh tokens), OAuth (Google)
- **Real-time:** Socket.IO for WebSockets
- **Email Service:** Nodemailer with RabbitMQ message queue (fallback support)
- **Caching:** Redis
- **File Upload:** Cloudinary, Multer
- **Security:** Bcrypt, CSRF protection, Rate limiting
- **Testing:** Node built-in test runner with Supertest

### Frontend
- **Framework:** React 18+ with Vite
- **State Management:** Redux Toolkit
- **API Client:** Axios
- **Data Fetching:** TanStack React Query
- **UI Components:** Radix UI, Tailwind CSS
- **Animations:** Framer Motion, GSAP
- **Icons:** Lucide React
- **Date Utils:** date-fns
- **Real-time:** Socket.IO Client

## 📄 Pages & Features

| Feature | Description |
|---------|-------------|
| **Authentication** | Signup, Login, Email Verification, Password Reset, Google OAuth |
| **User Profile** | View profiles, Edit info, Follow/Unfollow users, User recommendations |
| **Posts** | Create, Edit, Delete posts with image uploads, Like, Comment, Share |
| **Reels** | Video content creation and playback |
| **Messages** | Real-time direct messaging with conversations |
| **Notifications** | Live notifications for likes, comments, follows, messages |
| **Follow System** | Follow/Unfollow users, View followers/following lists |
| **Hashtags** | Search posts by hashtags |
| **Trending** | Trending posts and hashtags bar |
| **Status** | User online/offline status tracking |
| **Search** | Search users and content |

## 🗂️ Project Structure
```
backend/     → Express server, controllers, models, routes, middleware
frontend/    → React app, components, pages, hooks, services, store
uploads/     → User-uploaded file storage
```

## 🚀 Quick Start
```bash
npm install && npm run dev
```

## 📚 Key Endpoints
- `/api/v1/auth/*` - Authentication routes
- `/api/v1/user/*` - User operations
- `/api/v1/post/*` - Post CRUD
- `/api/v1/message/*` - Messaging
- `/api/v1/notification/*` - Notifications
- `/api/v1/follow/*` - Following system
