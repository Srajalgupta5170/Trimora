import mongoose from 'mongoose';

const salonSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true,
      },
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 4.5,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    image: {
      type: String,
      default: 'https://images.unsplash.com/photo-1599662150142-3c5dbe2b1a25?w=400&h=300&fit=crop',
    },
    gallery: [
      {
        url: String,
        publicId: String, // Cloudinary public ID for deletion
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    description: String,
    openingTime: {
      type: String,
      default: '09:00',
    },
    closingTime: {
      type: String,
      default: '21:00',
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

// Create geospatial index for nearby salons query
salonSchema.index({ location: '2dsphere' });

export default mongoose.models.Salon || mongoose.model('Salon', salonSchema);
