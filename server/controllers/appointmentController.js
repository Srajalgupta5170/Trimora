import Appointment from '../models/Appointment.js';
import Queue from '../models/Queue.js';
import Service from '../models/Service.js';

// Book appointment / join queue
export const bookAppointment = async (req, res) => {
  try {
    const customerId = req.user.id;
    const { barberId, serviceId, salonId } = req.body;

    // Verify service exists and belongs to this barber
    const service = await Service.findById(serviceId);
    if (!service || service.barberId.toString() !== barberId) {
      return res.status(400).json({ message: 'Invalid service for this barber' });
    }

    // Get current queue length to determine position
    const queueCount = await Queue.countDocuments({
      barberId,
      status: { $ne: 'done' },
    });

    // Create queue entry
    const queueEntry = await Queue.create({
      barberId,
      userId: customerId,
      position: queueCount + 1,
      status: 'waiting',
    });

    // Create appointment record
    const appointment = await Appointment.create({
      customerId,
      barberId,
      salonId,
      serviceId,
      queuePosition: queueCount + 1,
      estimatedWaitTime: queueCount * 15,
      status: 'waiting',
    });

    // Emit socket event for real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('queueUpdated', {
        barberId,
        action: 'customerJoined',
        queueLength: queueCount + 1,
      });
    }

    res.status(201).json({
      ...appointment.toObject(),
      queueEntry: queueEntry.toObject(),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get customer's active appointment
export const getCustomerAppointment = async (req, res) => {
  try {
    const customerId = req.user.id;

    const appointment = await Appointment.findOne({
      customerId,
      status: { $in: ['waiting', 'in-progress'] },
    })
      .populate('barberId')
      .populate('serviceId')
      .populate('salonId');

    if (!appointment) {
      return res.json(null);
    }

    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Leave queue / cancel appointment
export const cancelAppointment = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const customerId = req.user.id;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment || appointment.customerId.toString() !== customerId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Remove from queue
    await Queue.deleteOne({
      barberId: appointment.barberId,
      userId: customerId,
    });

    // Update appointment status
    appointment.status = 'cancelled';
    await appointment.save();

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.emit('queueUpdated', {
        barberId: appointment.barberId,
        action: 'customerCancelled',
      });
    }

    res.json({ message: 'Appointment cancelled' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
