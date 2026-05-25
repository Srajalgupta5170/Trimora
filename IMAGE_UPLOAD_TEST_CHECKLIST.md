# 🧪 Image Upload Testing Checklist

## Pre-Test Requirements

- ✅ Backend running on port 5000
- ✅ Frontend running on port 5173
- ✅ MongoDB connected
- ✅ Cloudinary credentials valid
- ✅ User logged in as Salon Owner

## Test 1: Logo Upload

1. Go to Dashboard → Media tab
2. Click "Upload Logo"
3. Select a JPG/PNG image (< 10MB)
4. **Expected**: 
   - ✅ Shows "Logo uploaded successfully"
   - ✅ Logo appears in dashboard
   - ✅ Image loads from Cloudinary CDN

5. **Verify in Cloudinary**:
   - Go to https://cloudinary.com/console
   - Check Media Library → barber-app folder
   - Logo file should be there

## Test 2: Banner Upload

1. In Media tab, click "Upload Banner"
2. Select an image (recommended 1200x400px)
3. **Expected**:
   - ✅ Banner uploads successfully
   - ✅ Banner displays on salon profile
   - ✅ Responsive on mobile

## Test 3: Gallery Images (Single)

1. Click "Add Gallery Image"
2. Select an image
3. Give it a title (optional)
4. **Expected**:
   - ✅ Image added to gallery
   - ✅ Appears in gallery grid
   - ✅ Can be deleted

## Test 4: Gallery Images (Multiple)

1. Select 3-5 images at once
2. Upload together
3. **Expected**:
   - ✅ All images upload
   - ✅ All appear in gallery
   - ✅ Can reorder by dragging

## Test 5: Image Deletion

1. Click delete on any gallery image
2. **Expected**:
   - ✅ Image removed from gallery immediately
   - ✅ Image deleted from Cloudinary (check after 5 seconds)
   - ✅ No orphaned files left

## Test 6: Image Reordering

1. Drag gallery images to new positions
2. **Expected**:
   - ✅ Order updates in real-time
   - ✅ Order persists after refresh

## Test 7: Main Image Setting

1. Upload an image to gallery
2. Click "Set as Main Image"
3. **Expected**:
   - ✅ Image becomes profile picture
   - ✅ Shows on salon listing page

## Test 8: Performance Test

1. Upload a high-res image (5MB+)
2. **Expected**:
   - ✅ Uploads within 3-5 seconds
   - ✅ Automatically optimized
   - ✅ Displays within 1 second (CDN cached)

## Test 9: Mobile Upload

1. Access dashboard on mobile/tablet
2. Upload an image
3. **Expected**:
   - ✅ File picker opens correctly
   - ✅ Upload works on mobile network
   - ✅ Image displays properly

## Test 10: Error Handling

### Test 10a: No File Selected
- Click upload without selecting file
- **Expected**: Error message appears

### Test 10b: Wrong File Type
- Try uploading PDF/video
- **Expected**: Only images allowed (error shown)

### Test 10c: File Too Large
- Try uploading 15MB+ file
- **Expected**: File size error message

## API Testing (For Developers)

### Test Upload Endpoint

```bash
# Using Postman or cURL

POST http://localhost:5000/api/salon/media/logo
Headers:
  Authorization: Bearer YOUR_JWT_TOKEN
  Content-Type: multipart/form-data
Body:
  file: <select your image>

# Expected Response:
{
  "success": true,
  "message": "Logo uploaded",
  "logo": {
    "url": "https://res.cloudinary.com/...",
    "cloudinaryId": "barber-app/..."
  }
}
```

### Test Multiple Upload

```bash
POST http://localhost:5000/api/images/upload-multiple/:salonId
Headers:
  Authorization: Bearer YOUR_JWT_TOKEN
  Content-Type: multipart/form-data
Body:
  images: [file1, file2, file3]
```

### Test Deletion

```bash
DELETE http://localhost:5000/api/images/:salonId/:imageIndex
Headers:
  Authorization: Bearer YOUR_JWT_TOKEN

# Should delete from both database and Cloudinary
```

## Success Metrics

- ✅ All 10 tests pass
- ✅ Images visible in Cloudinary dashboard
- ✅ No errors in browser console
- ✅ No errors in server logs
- ✅ Upload speed < 5 seconds
- ✅ Image load speed < 1 second
- ✅ Proper error messages for invalid uploads

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Upload fails silently | Check server logs, verify .env credentials |
| Image won't display | Check if URL is valid (should start with https://res.cloudinary) |
| Deletion doesn't work | Ensure image has `publicId` (was uploaded via new system) |
| Slow uploads | Check internet speed, file size, Cloudinary status |
| Wrong image format | Cloudinary auto-converts to JPG, check if acceptable |

## After Testing

1. ✅ Complete all tests successfully
2. ✅ Clear browser cache (Ctrl+Shift+Delete)
3. ✅ Test on different browsers (Chrome, Firefox, Edge)
4. ✅ Test on mobile device
5. ✅ Ready for deployment! 🚀

---

**Status: TESTING PHASE**
**Next: Deployment when all tests pass**
