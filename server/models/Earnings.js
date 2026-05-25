import mongoose from 'mongoose';

const earningsSchema = new mongoose.Schema(
  {
    barberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BarberProfile',
      required: true,
    },
    salonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Salon',
      required: true,
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      required: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    service: String,
    date: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'cancelled'],
      default: 'completed',
    },
  },
  { timestamps: true }
);

// Index for analytics queries
earningsSchema.index({ barberId: 1, date: 1 });
earningsSchema.index({ salonId: 1, date: 1 });
earningsSchema.index({ date: 1 });

export default mongoose.models.Earnings || mongoose.model('Earnings', earningsSchema);
