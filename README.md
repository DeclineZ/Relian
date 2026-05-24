# Relian Monorepo

This repository contains both the frontend and backend code for the Relian application.


## Directory Structure

- `/frontend` - Vite React frontend application with Capacitor support.
- `/backend` - Node.js Express backend API, optimized for local running and Vercel Serverless Function hosting.

---

## Local Development

### 1. Backend

Navigate to `/backend` and install dependencies:
```bash
cd backend
npm install
```

Configure `.env` file in the `backend/` directory:
```env
GROQ_API_KEY=your_groq_api_key
GOOGLE_API_KEY=your_google_custom_search_api_key
GOOGLE_CX=your_google_custom_search_cx_key
```

Run the backend in development mode:
```bash
npm run dev
```
The backend will run on [http://localhost:5001](http://localhost:5001).

### 2. Frontend

Navigate to `/frontend` and install dependencies:
```bash
cd frontend
npm install
```

Configure `.env.local` file in the `frontend/` directory:
```env
VITE_API_URL=http://localhost:5001
```

Run the frontend in development mode:
```bash
npm run dev
```
The frontend will run on [http://localhost:5173](http://localhost:5173).

---

## Deploying to Vercel

Vercel handles monorepos natively. You will create **two separate projects** in your Vercel Dashboard from this single GitHub repository.

### 1. Deploy the Backend
- **Root Directory**: `backend`
- **Framework Preset**: `Other` (Vercel automatically detects the Express configuration inside `backend/vercel.json`)
- **Environment Variables**:
  - Add `GROQ_API_KEY`, `GOOGLE_API_KEY`, and `GOOGLE_CX` with your production API keys.
- **Deploy**: Click Deploy. Vercel will build and serve your backend. Note the generated backend URL (e.g. `https://relian-backend.vercel.app`).

### 2. Deploy the Frontend
- **Root Directory**: `frontend`
- **Framework Preset**: `Vite`
- **Build & Development Settings**: Standard settings (Build command: `npm run build`, Output directory: `dist`)
- **Environment Variables**:
  - Add `VITE_API_URL` pointing to the backend URL you deployed in Step 1 (e.g. `https://relian-backend.vercel.app`).
- **Deploy**: Click Deploy. The frontend is now live!
