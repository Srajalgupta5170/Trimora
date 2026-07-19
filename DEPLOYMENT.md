# Trimora - Deployment Guide

## Overview
This guide covers deploying the Trimora application:
- **Frontend**: React + Vite → Vercel
- **Backend**: Node.js + Express → Render
- **Database**: MongoDB Atlas (already cloud-hosted)

---

## STEP 1: Prepare for Deployment

### 1.1 Frontend Setup (Vercel)

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Create `.env.local` in client folder**
   ```
   VITE_API_URL=https://your-render-backend.onrender.com/api
   ```

3. **Build test locally**
   ```bash
   cd client
   npm run build
   ```

### 1.2 Backend Setup (Render)

1. **Update backend configuration**
   - Verify `server.js` listens on `process.env.PORT || 5000`
   - Ensure `package.json` has `"start": "node server/server.js"`

2. **Create `.env` file in server folder** (with your actual values)
   ```
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://your-username:password@cluster.mongodb.net/trimora
   JWT_SECRET=your-super-secret-key-change-this
   PORT=5000
   CLOUDINARY_CLOUD_NAME=your-cloud
   CLOUDINARY_API_KEY=your-key
   CLOUDINARY_API_SECRET=your-secret
   FRONTEND_URL=https://your-vercel-app.vercel.app
   ```

3. **Test build locally**
   ```bash
   cd server
   npm install
   node server.js
   ```

---

## STEP 2: Deploy Backend to Render

### 2.1 Create Render Account
1. Go to https://render.com
2. Sign up with GitHub account (recommended)
3. Connect your GitHub repository

### 2.2 Create Web Service
1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. **Configuration:**
   - **Name**: trimora-backend
   - **Runtime**: Node.js
   - **Build Command**: `npm install`
   - **Start Command**: `node server/server.js`
   - **Environment**: Production

### 2.3 Add Environment Variables
In Render dashboard, add these variables:
```
NODE_ENV=production
MONGODB_URI=<your-mongodb-connection-string>
JWT_SECRET=<your-secret-key>
PORT=5000
CLOUDINARY_CLOUD_NAME=<your-value>
CLOUDINARY_API_KEY=<your-value>
CLOUDINARY_API_SECRET=<your-value>
FRONTEND_URL=<your-vercel-url>
```

### 2.4 Deploy
- Render auto-deploys on push to main branch
- You'll get a URL like: `https://trimora-backend.onrender.com`
- Copy this URL for frontend configuration

---

## STEP 3: Deploy Frontend to Vercel

### 3.1 Create Vercel Account
1. Go to https://vercel.com
2. Sign up with GitHub
3. Authorize Vercel to access your repositories

### 3.2 Import Project
1. Click "New Project"
2. Select your GitHub repository
3. **Configuration:**
   - **Framework**: Vite
   - **Root Directory**: `./client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### 3.3 Add Environment Variables
In Vercel dashboard, add:
```
VITE_API_URL=https://trimora-backend.onrender.com/api
```

### 3.4 Deploy
- Click "Deploy"
- Vercel will build and deploy automatically
- You'll get a URL like: `https://trimora.vercel.app`

---

## STEP 4: Update Backend CORS & URLs

After getting Vercel URL, update backend `.env`:
```
FRONTEND_URL=https://your-vercel-url.vercel.app
SOCKET_IO_CORS_ORIGIN=https://your-vercel-url.vercel.app
```

Then push to trigger Render redeploy.

---

## STEP 5: Verification Checklist

- [ ] Backend deployed and running on Render
- [ ] Frontend deployed and running on Vercel
- [ ] API calls work correctly
- [ ] Authentication flows work
- [ ] Real-time features (Socket.IO) connect
- [ ] Images upload to Cloudinary
- [ ] Database operations work

---

## Troubleshooting

### Frontend shows blank page
- Check browser console for errors
- Verify `VITE_API_URL` environment variable
- Check CORS configuration on backend

### API calls fail (404)
- Verify backend URL in frontend `.env`
- Check backend is running on Render
- Verify API routes in backend

### Images not uploading
- Verify Cloudinary credentials in backend `.env`
- Check image size doesn't exceed 10MB limit

### Real-time features not working
- Verify Socket.IO CORS settings
- Check frontend URL matches `SOCKET_IO_CORS_ORIGIN`
- Restart backend after updating `.env`

---

## Important Notes

⚠️ **Security**
- Never commit `.env` files with real credentials
- Use strong, unique `JWT_SECRET`
- Keep Cloudinary credentials private
- Rotate secrets periodically

🔄 **Auto-Deploy**
- Render & Vercel auto-deploy on main branch push
- Staging environments: create new branches

📊 **Monitoring**
- Monitor Render logs: Dashboard → Logs
- Monitor Vercel builds: Dashboard → Deployments
- Set up error alerts in production

---

## Production Deployment Completed! 🚀

Your Trimora application is now live and accessible worldwide!
