# Vivah - Matrimonial Platform

Vivah is a full-stack matrimonial platform designed to help people find their perfect life partners. It features a complete user lifecycle from registration and profile building to searching, profile viewing, and premium payment integrations.

## 🚀 Features

- **Authentication & Security**: Secure login/registration with email verification, forgot password, and reset password functionality.
- **Dynamic Profiles**: Comprehensive profile fields including bio, personal details, education, and social preferences.
- **Search & Discovery**: Advanced search functionality to find potential matches based on various criteria.
- **Admin Dashboard**: Manage users, profiles, and oversee platform activity.
- **Payment Integration**: Support for Razorpay payments to unlock premium features.
- **Responsive Design**: Built with Tailwind CSS and Framer Motion for a smooth, premium experience across all devices.

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 (Vite)
- **Language**: TypeScript
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Styling**: Tailwind CSS, Lucide React
- **Animations**: Framer Motion
- **Forms**: React Hook Form with Zod validation

### Backend
- **Framework**: Node.js with Express 5
- **Database**: MongoDB with Mongoose
- **Security**: Helmet, Express Mongo Sanitize, Rate Limiting (express-rate-limit)
- **Utilities**: Morgan, Compression, Nodemailer, Razorpay SDK

## 📋 Prerequisites

- Node.js (v18 or higher)
- MongoDB (Running locally or on Atlas)
- npm or yarn

## ⚙️ Getting Started

### 1. Clone the repository
```bash
git clone <repository-url>
cd vivah
```

### 2. Setup Server
```bash
cd server
npm install
```
Create a `.env` file in the `server` directory:
```env
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
# Optional: Nodemailer & Razorpay credentials
```

### 3. Setup Frontend
```bash
cd ..
npm install
```

### 4. Run Locally
In the root directory, run:
```bash
npm run dev
```
This will start both the frontend (Vite) and backend (Express) concurrently.

## ☁️ Deployment with @mcp:cloudrun

This project can be easily deployed to **Google Cloud Run** using the `cloudrun` MCP server tools.

### Available Tools:
- `mcp:cloudrun:deploy_local_folder`: Deploy the server folder directly to Cloud Run.
- `mcp:cloudrun:get_service`: Monitor the status of your deployed Vivah service.
- `mcp:cloudrun:list_services`: View all deployed services in your GCP project.

### Recommended Workflow:
1. Ensure your Google Cloud Project is set up and billing is enabled.
2. Use `deploy_local_folder` Targeting the `server` directory to host the API.
3. For the frontend, you can build and deploy the `dist` folder to Cloud Run or Vercel.

## 🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License
This project is licensed under the ISC License.
