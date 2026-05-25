import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from server directory
dotenv.config({ path: path.join(__dirname, '../.env') });

console.log('🔧 Multer initialization:');
console.log('CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME ? '✅ Set' : (process.env.CLOUDINARY_NAME ? '⚠ Using legacy CLOUDINARY_NAME' : '❌ Missing'));
console.log('CLOUDINARY_API_KEY:', process.env.CLOUDINARY_API_KEY ? '✅ Set' : '❌ Missing');
console.log('CLOUDINARY_API_SECRET:', process.env.CLOUDINARY_API_SECRET ? '✅ Set' : '❌ Missing');

// Configure Cloudinary
// Prefer explicit CLOUDINARY_CLOUD_NAME; fall back to legacy CLOUDINARY_NAME for compatibility
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helpful debug: show the resolved cloud name (not secret)
const resolvedCloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_NAME;
console.log('Resolved Cloudinary cloud_name:', resolvedCloudName);
// Helpful runtime checks
if (!resolvedCloudName || resolvedCloudName.includes('REPLACE') || resolvedCloudName.toLowerCase().includes('barber')) {
  console.error('⚠️ Cloudinary cloud name is not configured correctly.');
  console.error('Please set CLOUDINARY_CLOUD_NAME in server/.env to the exact cloud name from https://cloudinary.com/console');
}

// Configure Cloudinary Storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'barber-app', // Folder in Cloudinary
    format: async (req, file) => 'jpg', // Convert all images to jpg
    public_id: (req, file) => {
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      return `${file.fieldname}-${timestamp}-${randomString}`;
    },
  },
});

// Configure multer with Cloudinary storage
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow only JPG/PNG/WEBP
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG, and WEBP images are allowed'), false);
    }
  },
});

export default upload;
