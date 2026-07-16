# Kapu-LK Deployment (Vercel + Render)

This project is a MERN app:
- Frontend (React CRA) → deploy on **Vercel**
- Backend (Express) → deploy on **Render**
- Database → **MongoDB Atlas** (free tier)

## 1) Push to GitHub (one time)
Create a new GitHub repo in your account (example name: `Kapu-LK`). Then push the code:

```bash
cd Kapu-LK
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<your-username>/Kapu-LK.git
git push -u origin main
```

Important: `.env` files are ignored by `.gitignore` and must NOT be pushed.

## 2) Backend on Render

### Option A (recommended): Blueprint deploy
This repo includes `render.yaml` so Render can auto-detect the service.

1. Go to Render → **New** → **Blueprint**
2. Select the GitHub repo
3. Render will create the service from `render.yaml`

### Set environment variables (Render)
Add these variables in the Render service settings:

- `NODE_ENV` = `production`
- `PORT` = `5000` (Render sets this automatically sometimes; only add if needed)
- `MONGO_URI` = your MongoDB Atlas connection string
- `JWT_SECRET` = a strong random string
- `CORS_ORIGIN` = `https://<your-vercel-domain>.vercel.app`
- `CLIENT_URL` = `https://<your-vercel-domain>.vercel.app`

If using Cloudinary:
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

If using password reset emails (SMTP):
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE` (`true` or `false`)
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`

After deploy, you will get a backend URL like:
`https://kapu-lk-api.onrender.com`

Your API base will be:
`https://kapu-lk-api.onrender.com/api`

## 3) Frontend on Vercel
1. Vercel → **New Project** → Import the GitHub repo
2. Set **Root Directory** = `client`
3. Add Vercel environment variable:
   - `REACT_APP_API_URL` = `https://<your-render-domain>.onrender.com/api`
4. Deploy

Note: `client/vercel.json` is included to support React Router refresh (`/users/123` etc.).

## 4) Final checks
- Open the Vercel URL and test:
  - register/login
  - browse profiles
  - search filters
  - profile update

