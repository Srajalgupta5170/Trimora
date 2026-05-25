import mongoose from 'mongoose';

const barberRequestSchema = new mongoose.Schema(
  {
    barberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    salonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Salon',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    experience: Number,
    specializations: [String],
    requestMessage: String,
    rejectionReason: String,
    approvedAt: Date,
    rejectedAt: Date,
    requestedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Index for faster queries
barberRequestSchema.index({ salonId: 1, status: 1 });
barberRequestSchema.index({ barberId: 1, salonId: 1 }, { unique: true });

export default mongoose.models.BarberRequest || mongoose.model('BarberRequest', barberRequestSchema);
