import mongoose from 'mongoose';

const barberProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    salonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Salon',
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    experience: {
      type: Number, // years
      default: 0,
    },
    specializations: [String], // e.g., ['Fade', 'Undercut', 'Beard Trim']
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
    profileImage: {
      type: String,
      default: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
    },
    basePrice: {
      type: Number,
      default: 150, // Starting price in rupees
    },
    bio: String,
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.BarberProfile || mongoose.model('BarberProfile', barberProfileSchema);
