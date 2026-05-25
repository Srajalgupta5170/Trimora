# Cloudinary Image Upload - Troubleshooting & Testing Guide

## ✅ Current Status

- **Cloudinary Credentials**: Loaded ✅
- **Backend Server**: Running on port 5000 ✅
- **Frontend**: Running on port 5176 ✅
- **Middleware**: Configured ✅

## ❌ Problem: "Failed to load salon media"

This error appears when you try to access the Media dashboard but:
1. You ARE authenticated
2. But your account doesn't have a salon

### Why This Happens

The SalonMediaManager component calls `GET /salon/me/media` which:
1. Checks if authenticated user is a salon owner
2. Looks up the salon in database for this user
3. If NO salon found → "Salon not found" error

### Root Cause

Your current user account (`sagar gupta`) was likely created as a **customer** or **barber**, not a salon owner. So there's no salon linked to it.

## ✅ Solution: Create NEW Salon Owner Account

Follow these steps to test image uploads:

### Step 1: Go to Sign Up

1. Open http://localhost:5176
2. Click "Sign Up" tab

### Step 2: Select Salon Owner Role

Click the **"Salon Owner"** button (right button)

### Step 3: Fill in Registration Form

- **Name**: Your name
- **Email**: `test-owner@gmail.com` (NEW email)
- **Password**: `password123`
- **Salon Name**: `Test Salon`
- **Salon Location**: `123 Main St, City`

### Step 4: Submit

Click "Sign Up as Salon Owner"

The system will automatically:
- Create your owner user account
- Create a salon linked to you
- Log you in
- Redirect to dashboard

### Step 5: Go to Dashboard → Media Tab

1. Click "Dashboard" button
2. Click "Media" tab
3. **No error! Media page loads!** ✅

### Step 6: Test Upload

1. Click "Click to upload logo"
2. Select any image file (JPG, PNG)
3. Upload starts
4. Check browser console for logs
5. Check server terminal for debug info

### Expected Flow

```
User selects image
   ↓
Frontend: handleUpload() called
   ↓
API: POST /salon/me/logo with FormData
   ↓
Backend: multerMiddleware receives file
   ↓
Multer: Sends to Cloudinary
   ↓
Cloudinary: Returns secure_url + public_id
   ↓
Backend: Saves to MongoDB with cloud URL
   ↓
API: Returns { success: true, logo: {...} }
   ↓
Frontend: Displays success toast + image preview
```

## 🔍 How to Debug If Still Not Working

### Check Server Logs

Watch the terminal where server.js is running. When you upload, you should see:

```
=== uploadLogo ===
File received: Yes
File details: {
  filename: 'logo-1714123456789-abc123.jpg',
  size: 245000
}
Setting logo URL: https://res.cloudinary.com/...
```

If you don't see this:
- File didn't reach backend (network issue)
- Multer didn't process it (validation failed)

### Check Client Console

Open browser DevTools (F12) → Console tab

You should see:
```
Salon media response: { success: true, media: {...} }
```

If you see an error:
```
Error loading salon media: {...error details...}
```

### Common Errors & Solutions

| Error | Cause | Fix |
|-------|-------|-----|
| `Salon not found` | User has no salon | Create as Salon Owner |
| `No logo image provided` | File not sent | Check file input |
| `Only image files allowed` | Wrong file type | Use JPG/PNG |
| `CLOUDINARY_NAME: ❌ Missing` | Env vars not loaded | Restart server |
| Upload hangs forever | Cloudinary timeout | Check API keys |

## 📋 Checklist for Full Testing

- [ ] Create new Salon Owner account
- [ ] Log in to dashboard
- [ ] See Media tab without error
- [ ] Upload logo → Check server logs
- [ ] See success toast
- [ ] Image preview appears
- [ ] Go to Cloudinary.com → Media Library → barber-app folder
- [ ] See uploaded image there
- [ ] Upload banner
- [ ] Upload gallery images
- [ ] Try deleting an image
- [ ] Test mobile responsiveness

## 🎯 Next Steps

1. **Create test account** following the steps above
2. **Try uploading an image** to Media tab
3. **Watch server terminal** for logs
4. **Check Cloudinary dashboard** to verify image is there

Once this works:
- All other features work the same way
- Barber profile picture upload works
- Portfolio uploads work
- All use the same Cloudinary infrastructure

## 📞 Need Help?

If you're still getting errors after creating a new salon owner account:

1. **Take a screenshot** of the error
2. **Copy server terminal logs** showing the error
3. **Check Cloudinary credentials** are correct in `.env`
4. **Verify Cloudinary account** is active at https://cloudinary.com/console

---

**Key Points**:
✅ Cloudinary is configured correctly
✅ Backend can access credentials  
✅ Ready to upload images
✅ Just need a salon owner account to test

**Current blockers**:
❌ Your test account (`sagar gupta`) has no salon
✅ Easy fix: Create a new Salon Owner account
