# Cloudinary Setup Guide for Barber App

This guide will help you set up Cloudinary for cloud-based image storage in your barber app.

## Step 1: Create a Cloudinary Account

1. Go to [https://cloudinary.com](https://cloudinary.com)
2. Click **Sign Up** and choose **Free** plan
3. Complete the registration process
4. Verify your email

## Step 2: Get Your Cloudinary Credentials

1. After logging in, you'll be taken to the **Dashboard**
2. Look for the **Account Details** section on the right side
3. You'll see three values you need:
   - **Cloud Name** (e.g., `dxxxxxxxx`)
   - **API Key** (e.g., `123456789012345`)
   - **API Secret** (e.g., `abc123def456ghi789jkl`)

⚠️ **IMPORTANT**: Never share your API Secret publicly! It should only be in your `.env` file on your server.

## Step 3: Add Credentials to Your Server

Open `server/.env` and update the Cloudinary section:

```env
# Cloudinary Configuration
CLOUDINARY_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

**Example:**
```env
CLOUDINARY_NAME=dmyxyz123
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abc123def456ghi789jkl
```

## Step 4: Restart Your Server

After updating `.env`, restart your backend server:

```bash
# In PowerShell, from the server directory
node server/server.js
```

## Step 5: Test Image Uploads

1. Go to the **Salon Owner Dashboard** → **Media** tab
2. Try uploading:
   - A logo image
   - A banner image
   - A gallery image
3. You should see success messages

## Step 6: Verify Images in Cloudinary Dashboard

1. Log in to [Cloudinary Dashboard](https://cloudinary.com/console)
2. Go to **Media Library**
3. Navigate to folder `barber-app`
4. You should see your uploaded images there ✅

## Image Upload Features Now Available

### ✅ What's Fixed:

1. **Cloud Storage** - Images are stored in Cloudinary (not local disk)
2. **Automatic Optimization** - All images are compressed and optimized
3. **Secure URLs** - Images get secure HTTPS URLs
4. **No Salon Name Required** - Media uploads don't ask for form data anymore
5. **Fast Loading** - CDN-delivered images for better performance

### 📸 Upload Locations:

- **Logo** - Automatically resized and optimized
- **Banner** - Recommended 1200x400px (any size works)
- **Gallery** - Multiple images, unlimited count
- **Barber Profile Picture** - Resized to square format
- **Portfolio Images** - Categorized and organized

## Troubleshooting

### "Failed to upload" Error

**Problem**: Upload fails but no specific error message

**Solutions**:
1. Check if `.env` credentials are correct (copy-paste carefully)
2. Verify the Cloudinary account is active (log into Cloudinary dashboard)
3. Ensure image file is less than 10MB
4. Check if file is an actual image (JPG, PNG, WebP, etc.)

### Images Not Appearing

**Problem**: Upload succeeds but image doesn't display

**Solutions**:
1. Check browser console for broken image URL errors
2. Go to Cloudinary Media Library - are files actually there?
3. Try a different image file
4. Restart the backend server after updating `.env`

### API Key Error

**Problem**: Error about invalid Cloud Name or API Key

**Solutions**:
1. Double-check credentials in `.env` (spelling, spaces, etc.)
2. Regenerate API Key in Cloudinary Dashboard (if needed)
3. Make sure `.env` file is in `/server` directory
4. Restart server after each `.env` change

## Environment Variables Reference

```env
# REQUIRED for uploads to work
CLOUDINARY_NAME=        # Your cloud name from dashboard
CLOUDINARY_API_KEY=     # Your API key
CLOUDINARY_API_SECRET=  # Your API secret (NEVER share publicly!)

# OPTIONAL - Default folder for images
# Currently set to: "barber-app"
```

## Production Deployment

When deploying to production (e.g., Azure, AWS):

1. Add `.env` variables to your hosting platform's environment settings
2. Use the same Cloudinary credentials
3. Images will automatically be CDN-delivered globally

## Additional Cloudinary Features (Optional)

Once your basic setup works, you can enable advanced features:

- **Image Transformations** - Crop, resize, watermark images
- **Format Optimization** - Serve WebP to modern browsers
- **Analytics** - Track image bandwidth and usage

For more info: [Cloudinary Docs](https://cloudinary.com/documentation)

---

**Next Steps:**
1. Create a Cloudinary account
2. Get your credentials
3. Update `.env` file
4. Restart server
5. Test upload in dashboard
6. Success! 🎉
