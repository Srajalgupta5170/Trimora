import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
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
    serviceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: false,
    },
    servicePrice: {
      type: Number,
      min: 0,
      default: 0,
    },
    serviceName: String,
    status: {
      type: String,
      enum: ['waiting', 'in-progress', 'completed', 'cancelled'],
      default: 'waiting',
    },
    queuePosition: Number,
    estimatedWaitTime: Number, // in minutes
    appointmentTime: Date,
    completedTime: Date,
    notes: String,
  },
  { timestamps: true }
);

export default mongoose.models.Appointment || mongoose.model('Appointment', appointmentSchema);
