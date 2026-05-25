import Salon from '../models/Salon.js';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
dotenv.config({ path: path.join(__dirname, '../.env') });

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const getCloudinaryId = (file) => {
  if (file?.public_id) return file.public_id;
  if (file?.filename) return file.filename;
  const url = file?.secure_url || file?.path;
  if (!url) return null;
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+$/);
  return match ? match[1] : null;
};

// Upload salon image to gallery
export const uploadSalonImage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { salonId } = req.params;

    if (!req.file) {
      return res.status(400).json({ message: 'No file provided' });
    }

    console.log('📁 File object:', JSON.stringify({
      fieldname: req.file.fieldname,
      originalname: req.file.originalname,
      encoding: req.file.encoding,
      mimetype: req.file.mimetype,
      size: req.file.size,
      secure_url: req.file.secure_url ? 'YES' : 'NO',
      public_id: req.file.public_id ? 'YES' : 'NO',
      path: req.file.path ? 'YES' : 'NO',
    }, null, 2));

    // Verify owner
    const salon = await Salon.findById(salonId);
    if (!salon || salon.ownerId.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Use Cloudinary URL from multer-storage-cloudinary
    const imageUrl = req.file.secure_url;
    const publicId = getCloudinaryId(req.file);

    console.log('🖼️  Image URL:', imageUrl);
    console.log('🔑 Public ID:', publicId);

    // Add to gallery with Cloudinary metadata
    salon.gallery.push({
      url: imageUrl,
      publicId: publicId, // Store for deletion
      uploadedAt: new Date(),
    });

    // Update main image if first upload
    if (!salon.image || salon.image.includes('unsplash')) {
      salon.image = imageUrl;
    }

    await salon.save();

    res.json({
      message: 'Image uploaded successfully',
      image: {
        url: imageUrl,
        uploadedAt: new Date(),
      },
      gallery: salon.gallery,
    });
  } catch (error) {
    console.error('❌ Upload error:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({ message: error.message });
  }
};

// Upload multiple images
export const uploadMultipleImages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { salonId } = req.params;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files provided' });
    }

    // Verify owner
    const salon = await Salon.findById(salonId);
    if (!salon || salon.ownerId.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const uploadedImages = [];

    for (const file of req.files) {
      const imageUrl = file.secure_url;
      const publicId = getCloudinaryId(file);
      
      salon.gallery.push({
        url: imageUrl,
        publicId: publicId, // Store for deletion
        uploadedAt: new Date(),
      });
      uploadedImages.push(imageUrl);
    }

    // Update main image if first upload
    if (!salon.image || salon.image.includes('unsplash')) {
      salon.image = uploadedImages[0];
    }

    await salon.save();

    res.json({
      message: `${uploadedImages.length} images uploaded successfully`,
      images: uploadedImages,
      totalGalleryImages: salon.gallery.length,
    });
  } catch (error) {
    console.error('Multiple upload error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get salon gallery
export const getSalonGallery = async (req, res) => {
  try {
    const { salonId } = req.params;

    const salon = await Salon.findById(salonId).select('gallery image name');
    if (!salon) {
      return res.status(404).json({ message: 'Salon not found' });
    }

    res.json({
      salonId: salon._id,
      salonName: salon.name,
      mainImage: salon.image,
      gallery: salon.gallery,
      totalImages: salon.gallery.length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete image from gallery
export const deleteSalonImage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { salonId, imageIndex } = req.params;

    // Verify owner
    const salon = await Salon.findById(salonId);
    if (!salon || salon.ownerId.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const image = salon.gallery[imageIndex];
    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    // Delete from Cloudinary if it has a publicId
    if (image.publicId) {
      try {
        await cloudinary.uploader.destroy(image.publicId);
        console.log(`✅ Deleted Cloudinary image: ${image.publicId}`);
      } catch (cloudinaryError) {
        console.error('Error deleting from Cloudinary:', cloudinaryError);
        // Continue anyway - don't fail the request
      }
    }

    // Remove from gallery
    salon.gallery.splice(imageIndex, 1);

    // If deleted image was main image, set new main image
    if (salon.image === image.url) {
      salon.image = salon.gallery.length > 0 
        ? salon.gallery[0].url 
        : 'https://images.unsplash.com/photo-1599662150142-3c5dbe2b1a25?w=400&h=300&fit=crop';
    }

    await salon.save();

    res.json({
      message: 'Image deleted successfully',
      gallery: salon.gallery,
    });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Set main image
export const setMainImage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { salonId, imageIndex } = req.params;

    // Verify owner
    const salon = await Salon.findById(salonId);
    if (!salon || salon.ownerId.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const image = salon.gallery[imageIndex];
    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    salon.image = image.url;
    await salon.save();

    res.json({
      message: 'Main image updated',
      mainImage: salon.image,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// For Cloudinary integration (optional - commented out for now)
/*
import cloudinary from 'cloudinary';

export const uploadToCloudinary = async (req, res) => {
  try {
    const userId = req.user.id;
    const { salonId } = req.params;

    if (!req.file) {
      return res.status(400).json({ message: 'No file provided' });
    }

    // Verify owner
    const salon = await Salon.findById(salonId);
    if (!salon || salon.ownerId.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Upload to Cloudinary
    const result = await cloudinary.v2.uploader.upload_stream(
      { folder: `salons/${salonId}` },
      async (error, result) => {
        if (error) {
          return res.status(400).json({ message: 'Upload failed' });
        }

        salon.gallery.push({
          url: result.secure_url,
          uploadedAt: new Date(),
        });

        if (!salon.image || salon.image.includes('unsplash')) {
          salon.image = result.secure_url;
        }

        await salon.save();

        res.json({
          message: 'Image uploaded successfully',
          image: {
            url: result.secure_url,
            uploadedAt: new Date(),
          },
        });
      }
    );

    req.file.stream.pipe(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
*/
