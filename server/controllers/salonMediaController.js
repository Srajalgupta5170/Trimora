import SalonMedia from '../models/SalonMedia.js';
import BarberProfile from '../models/BarberProfile.js';
import Salon from '../models/Salon.js';
import mongoose from 'mongoose';

const getCloudinaryId = (file) => {
  if (file?.public_id) return file.public_id;
  if (file?.filename) return file.filename;
  const url = file?.secure_url || file?.path;
  if (!url) return null;
  const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-zA-Z0-9]+$/);
  return match ? match[1] : null;
};

/**
 * Get salon media (public)
 */
export const getSalonMedia = async (req, res) => {
  try {
    const { salonId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(salonId)) {
      return res.status(400).json({ error: 'Invalid salon ID' });
    }

    let media = await SalonMedia.findOne({ salonId });

    // If no media exists, return empty media object (don't fail)
    if (!media) {
      media = {
        salonId,
        logo: { url: null, cloudinaryId: null },
        banner: { url: null, cloudinaryId: null },
        gallery: []
      };
    }

    res.json({
      success: true,
      media
    });
  } catch (error) {
    console.error('Error fetching salon media:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Get my salon media (for salon owner)
 */
export const getMySalonMedia = async (req, res) => {
  try {
    console.log('=== getMySalonMedia ===');
    console.log('User ID:', req.user?.id);
    console.log('User Role:', req.user?.role);
    
    const salon = await Salon.findOne({ ownerId: req.user.id });
    console.log('Salon found:', salon ? 'Yes' : 'No', salon?._id);

    if (!salon) {
      console.log('No salon found for owner:', req.user.id);
      return res.status(404).json({ error: 'Salon not found' });
    }

    let media = await SalonMedia.findOne({ salonId: salon._id });
    console.log('Media found:', media ? 'Yes' : 'No');

    if (!media) {
      // Create default media if doesn't exist
      console.log('Creating new media document');
      media = new SalonMedia({ salonId: salon._id });
      await media.save();
    }

    res.json({
      success: true,
      media
    });
  } catch (error) {
    console.error('Error fetching salon media:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

/**
 * Update salon description and branding
 */
export const updateSalonInfo = async (req, res) => {
  try {
    const { description, ambiance, brandColor } = req.body;

    const salon = await Salon.findOne({ ownerId: req.user.id });

    if (!salon) {
      return res.status(404).json({ error: 'Salon not found' });
    }

    let media = await SalonMedia.findOne({ salonId: salon._id });

    if (!media) {
      media = new SalonMedia({ salonId: salon._id });
    }

    if (description !== undefined) media.description = description;
    if (ambiance !== undefined) media.ambiance = ambiance;
    if (brandColor !== undefined) {
      media.brandColor = {
        primary: brandColor.primary || media.brandColor?.primary,
        accent: brandColor.accent || media.brandColor?.accent
      };
    }

    await media.save();

    res.json({
      success: true,
      message: 'Salon info updated',
      media
    });
  } catch (error) {
    console.error('Error updating salon info:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Upload salon logo
 */
export const uploadLogo = async (req, res) => {
  try {
    console.log('=== uploadLogo ===');
    console.log('File received:', req.file ? 'Yes' : 'No');
    console.log('User:', req.user ? `ID=${req.user.id}, Role=${req.user.role}` : 'No user');
    
    if (!req.file) {
      return res.status(400).json({ error: 'No logo image provided' });
    }

    const salon = await Salon.findOne({ ownerId: req.user.id });
    console.log('Salon found:', salon ? `ID=${salon._id}, Name=${salon.name}` : 'No');

    if (!salon) {
      return res.status(404).json({ error: 'Salon not found for this owner' });
    }

    let media = await SalonMedia.findOne({ salonId: salon._id });

    if (!media) {
      media = new SalonMedia({ salonId: salon._id });
    }

    const logoUrl = req.file.secure_url || req.file.path;
    console.log('Setting logo URL:', logoUrl);
    
    media.logo = {
      url: logoUrl,
      cloudinaryId: getCloudinaryId(req.file)
    };

    await media.save();
    console.log('✅ Logo saved successfully');

    res.json({
      success: true,
      message: 'Logo uploaded',
      logo: media.logo
    });
  } catch (error) {
    console.error('❌ Error uploading logo:', error);
    res.status(500).json({ 
      error: 'Server error uploading logo', 
      details: error.message 
    });
  }
};

/**
 * Upload salon banner
 */
export const uploadBanner = async (req, res) => {
  try {
    console.log('=== uploadBanner ===');
    console.log('File received:', req.file ? 'Yes' : 'No');
    console.log('User:', req.user ? `ID=${req.user.id}, Role=${req.user.role}` : 'No user');
    
    if (!req.file) {
      return res.status(400).json({ error: 'No banner image provided' });
    }

    const salon = await Salon.findOne({ ownerId: req.user.id });
    console.log('Salon found:', salon ? `ID=${salon._id}, Name=${salon.name}` : 'No');

    if (!salon) {
      return res.status(404).json({ error: 'Salon not found for this owner' });
    }

    let media = await SalonMedia.findOne({ salonId: salon._id });

    if (!media) {
      media = new SalonMedia({ salonId: salon._id });
    }

    const bannerUrl = req.file.secure_url || req.file.path;
    console.log('Setting banner URL:', bannerUrl);

    media.banner = {
      url: bannerUrl,
      cloudinaryId: getCloudinaryId(req.file)
    };

    await media.save();
    console.log('✅ Banner saved successfully');

    res.json({
      success: true,
      message: 'Banner uploaded',
      banner: media.banner
    });
  } catch (error) {
    console.error('❌ Error uploading banner:', error);
    res.status(500).json({ 
      error: 'Server error uploading banner', 
      details: error.message 
    });
  }
};

/**
 * Add image to gallery
 */
export const addGalleryImage = async (req, res) => {
  try {
    console.log('=== addGalleryImage ===');
    console.log('File received:', req.file ? 'Yes' : 'No');
    console.log('User:', req.user ? `ID=${req.user.id}, Role=${req.user.role}` : 'No user');
    
    if (!req.file) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const { title } = req.body;

    const salon = await Salon.findOne({ ownerId: req.user.id });
    console.log('Salon found:', salon ? `ID=${salon._id}, Name=${salon.name}` : 'No');

    if (!salon) {
      return res.status(404).json({ error: 'Salon not found for this owner' });
    }

    let media = await SalonMedia.findOne({ salonId: salon._id });

    if (!media) {
      media = new SalonMedia({ salonId: salon._id });
    }

    const imageUrl = req.file.secure_url || req.file.path;
    console.log('Adding gallery image:', imageUrl);

    const displayOrder = media.gallery.length;

    media.gallery.push({
      url: imageUrl,
      cloudinaryId: getCloudinaryId(req.file),
      title: title || 'Gallery Image',
      displayOrder
    });

    await media.save();
    console.log('✅ Gallery image saved successfully');

    res.status(201).json({
      success: true,
      message: 'Gallery image added',
      image: media.gallery[media.gallery.length - 1]
    });
  } catch (error) {
    console.error('❌ Error adding gallery image:', error);
    res.status(500).json({ 
      error: 'Server error adding gallery image', 
      details: error.message 
    });
  }
};

/**
 * Remove gallery image
 */
export const removeGalleryImage = async (req, res) => {
  try {
    const { imageIndex } = req.params;

    const salon = await Salon.findOne({ ownerId: req.user.id });

    if (!salon) {
      return res.status(404).json({ error: 'Salon not found' });
    }

    const media = await SalonMedia.findOne({ salonId: salon._id });

    if (!media || !media.gallery[imageIndex]) {
      return res.status(404).json({ error: 'Gallery image not found' });
    }

    media.gallery.splice(imageIndex, 1);

    // Recalculate display order
    media.gallery.forEach((img, idx) => {
      img.displayOrder = idx;
    });

    await media.save();

    res.json({
      success: true,
      message: 'Gallery image removed'
    });
  } catch (error) {
    console.error('Error removing gallery image:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Update gallery image order
 */
export const updateGalleryOrder = async (req, res) => {
  try {
    const { images } = req.body; // Array of gallery items in new order

    const salon = await Salon.findOne({ ownerId: req.user.id });

    if (!salon) {
      return res.status(404).json({ error: 'Salon not found' });
    }

    const media = await SalonMedia.findOne({ salonId: salon._id });

    if (!media) {
      return res.status(404).json({ error: 'Salon media not found' });
    }

    // Update gallery with new order
    media.gallery = images.map((img, idx) => ({
      ...img,
      displayOrder: idx
    }));

    await media.save();

    res.json({
      success: true,
      message: 'Gallery order updated',
      gallery: media.gallery
    });
  } catch (error) {
    console.error('Error updating gallery order:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

/**
 * Get salon gallery (public)
 */
export const getGallery = async (req, res) => {
  try {
    const { salonId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(salonId)) {
      return res.status(400).json({ error: 'Invalid salon ID' });
    }

    const media = await SalonMedia.findOne({ salonId });

    if (!media) {
      return res.status(404).json({ error: 'Salon media not found' });
    }

    res.json({
      success: true,
      gallery: media.gallery
    });
  } catch (error) {
    console.error('Error fetching gallery:', error);
    res.status(500).json({ error: 'Server error' });
  }
};
