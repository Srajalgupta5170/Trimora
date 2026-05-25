import mongoose from 'mongoose';

const salonMediaSchema = new mongoose.Schema(
  {
    salonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Salon',
      required: true,
      unique: true,
      index: true
    },

    // Logo
    logo: {
      url: {
        type: String,
        default: null
      },
      cloudinaryId: {
        type: String,
        default: null
      }
    },

    // Banner/Hero Image
    banner: {
      url: {
        type: String,
        default: null
      },
      cloudinaryId: {
        type: String,
        default: null
      }
    },

    // Gallery Images
    gallery: [
      {
        url: {
          type: String,
          required: true
        },
        cloudinaryId: {
          type: String,
          default: null
        },
        title: {
          type: String,
          default: 'Salon Photo'
        },
        displayOrder: {
          type: Number,
          default: 0
        },
        _id: false
      }
    ],

    // Branding Colors
    brandColor: {
      primary: {
        type: String,
        default: '#6366F1' // Indigo
      },
      accent: {
        type: String,
        default: '#A855F7' // Purple
      }
    },

    // Description
    description: {
      type: String,
      default: '',
      maxlength: 500
    },

    // Ambiance/Vibe (for customer filtering)
    ambiance: {
      type: [String],
      enum: ['Luxurious', 'Modern', 'Vintage', 'Casual', 'Premium'],
      default: ['Modern']
    }
  },
  { timestamps: true }
);

export default mongoose.models.SalonMedia || mongoose.model('SalonMedia', salonMediaSchema);
