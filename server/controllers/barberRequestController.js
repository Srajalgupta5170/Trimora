import BarberRequest from '../models/BarberRequest.js';
import BarberProfile from '../models/BarberProfile.js';
import Salon from '../models/Salon.js';
import User from '../models/user.js';

// Barber requests to join a salon
export const requestToJoinSalon = async (req, res) => {
  try {
    const userId = req.user.id;
    const { salonId, experience, specializations, message } = req.body;

    // Validate salon exists
    const salon = await Salon.findById(salonId);
    if (!salon) {
      return res.status(404).json({ message: 'Salon not found' });
    }

    // Check if already requested
    const existingRequest = await BarberRequest.findOne({
      barberId: userId,
      salonId,
      status: { $in: ['pending', 'approved'] },
    });

    if (existingRequest) {
      return res.status(400).json({
        message: 'You already have a pending or approved request for this salon',
      });
    }

    // Create request
    const barberRequest = new BarberRequest({
      barberId: userId,
      salonId,
      experience,
      specializations,
      requestMessage: message,
      status: 'pending',
    });

    await barberRequest.save();

    res.status(201).json({
      message: 'Request sent successfully',
      request: barberRequest,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get pending requests for salon owner
export const getPendingRequests = async (req, res) => {
  try {
    const userId = req.user.id;

    // Verify owner
    const salon = await Salon.findOne({ ownerId: userId });
    if (!salon) {
      return res.status(403).json({ message: 'You are not a salon owner' });
    }

    const requests = await BarberRequest.find({
      salonId: salon._id,
      status: 'pending',
    })
      .populate('barberId', 'name email phone')
      .sort({ requestedAt: -1 });

    res.json({
      salonId: salon._id,
      totalPending: requests.length,
      requests,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Approve barber request
export const approveBarberRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { requestId } = req.params;

    // Find request
    const barberRequest = await BarberRequest.findById(requestId);
    if (!barberRequest) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Verify salon owner
    const salon = await Salon.findById(barberRequest.salonId);
    if (salon.ownerId.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Update request status
    barberRequest.status = 'approved';
    barberRequest.approvedAt = new Date();
    await barberRequest.save();

    // Create barber profile if doesn't exist
    const barber = await User.findById(barberRequest.barberId);
    const existingProfile = await BarberProfile.findOne({
      userId: barberRequest.barberId,
      salonId: barberRequest.salonId,
    });

    if (!existingProfile) {
      const profile = new BarberProfile({
        userId: barberRequest.barberId,
        salonId: barberRequest.salonId,
        name: barber.name,
        experience: barberRequest.experience || 0,
        specializations: barberRequest.specializations || [],
        isActive: true,
      });
      await profile.save();
    }

    res.json({
      message: 'Barber approved successfully',
      request: barberRequest,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Reject barber request
export const rejectBarberRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { requestId } = req.params;
    const { reason } = req.body;

    // Find request
    const barberRequest = await BarberRequest.findById(requestId);
    if (!barberRequest) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Verify salon owner
    const salon = await Salon.findById(barberRequest.salonId);
    if (salon.ownerId.toString() !== userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Update request status
    barberRequest.status = 'rejected';
    barberRequest.rejectionReason = reason;
    barberRequest.rejectedAt = new Date();
    await barberRequest.save();

    res.json({
      message: 'Request rejected',
      request: barberRequest,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get barber's requests
export const getBarberRequests = async (req, res) => {
  try {
    const userId = req.user.id;

    const requests = await BarberRequest.find({ barberId: userId })
      .populate('salonId', 'name address')
      .sort({ requestedAt: -1 });

    res.json({
      requests,
      total: requests.length,
      approved: requests.filter(r => r.status === 'approved').length,
      pending: requests.filter(r => r.status === 'pending').length,
      rejected: requests.filter(r => r.status === 'rejected').length,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all requests for salon (with filters)
export const getAllSalonRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    const salon = await Salon.findOne({ ownerId: userId });
    if (!salon) {
      return res.status(403).json({ message: 'You are not a salon owner' });
    }

    let query = { salonId: salon._id };
    if (status) {
      query.status = status;
    }

    const requests = await BarberRequest.find(query)
      .populate('barberId', 'name email phone')
      .sort({ requestedAt: -1 });

    res.json({
      salonId: salon._id,
      requests,
      stats: {
        total: requests.length,
        pending: requests.filter(r => r.status === 'pending').length,
        approved: requests.filter(r => r.status === 'approved').length,
        rejected: requests.filter(r => r.status === 'rejected').length,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
