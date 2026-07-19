import JoinRequest from '../models/JoinRequest.js';
import BarberProfile from '../models/BarberProfile.js';
import Salon from '../models/Salon.js';
import User from '../models/user.js';

/**
 * Barber submits a request to join a salon
 */
export const requestJoinSalon = async (req, res) => {
  try {
    const barberId = req.user.id;
    const { salonId, experience, specializations, basePrice, bio } = req.body;

    // Validate
    if (!salonId) {
      return res.status(400).json({ error: 'Salon ID is required' });
    }

    // Check if barber is already in a salon
    const existingProfile = await BarberProfile.findOne({ userId: barberId });
    if (existingProfile) {
      return res.status(400).json({ error: 'You already have a profile in a salon' });
    }

    // Check if already requested to join this salon
    const existingRequest = await JoinRequest.findOne({
      barberId,
      salonId,
      status: 'pending'
    });
    if (existingRequest) {
      return res.status(400).json({ error: 'You already have a pending request for this salon' });
    }

    // Check if salon exists
    const salon = await Salon.findById(salonId);
    if (!salon) {
      return res.status(404).json({ error: 'Salon not found' });
    }

    // Get barber details
    const barber = await User.findById(barberId);

    // Create join request
    const joinRequest = await JoinRequest.create({
      barberId,
      barberName: barber.name,
      barberEmail: barber.email,
      salonId,
      salonName: salon.name,
      experience: experience || 0,
      specializations: specializations || [],
      basePrice: basePrice || 150,
      bio: bio || ''
    });

    res.status(201).json({
      success: true,
      message: 'Join request submitted successfully',
      request: joinRequest
    });
  } catch (error) {
    console.error('Error requesting join:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Salon owner views pending join requests
 */
export const getPendingRequests = async (req, res) => {
  try {
    const ownerId = req.user.id;

    // Get all salons owned by this user
    const salons = await Salon.find({ ownerId });
    const salonIds = salons.map(s => s._id);

    // Get all pending requests for these salons
    const requests = await JoinRequest.find({
      salonId: { $in: salonIds },
      status: 'pending'
    }).populate('barberId', 'name email');

    res.json({
      success: true,
      count: requests.length,
      requests
    });
  } catch (error) {
    console.error('Error fetching requests:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Salon owner accepts a join request
 */
export const acceptJoinRequest = async (req, res) => {
  try {
    const ownerId = req.user.id;
    const { requestId } = req.params;

    // Get the request
    const joinRequest = await JoinRequest.findById(requestId);
    if (!joinRequest) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // Verify owner owns this salon
    const salon = await Salon.findById(joinRequest.salonId);
    if (salon.ownerId.toString() !== ownerId) {
      return res.status(403).json({ error: 'Not authorized to accept this request' });
    }

    // Create barber profile
    const barberProfile = await BarberProfile.create({
      userId: joinRequest.barberId,
      salonId: joinRequest.salonId,
      name: joinRequest.barberName,
      experience: joinRequest.experience,
      specializations: joinRequest.specializations,
      basePrice: joinRequest.basePrice,
      bio: joinRequest.bio,
      isApproved: true,
      approvedAt: new Date()
    });

    // Update request status
    joinRequest.status = 'accepted';
    joinRequest.respondedAt = new Date();
    joinRequest.respondedBy = ownerId;
    await joinRequest.save();

    res.json({
      success: true,
      message: 'Join request accepted',
      barberProfile,
      request: joinRequest
    });
  } catch (error) {
    console.error('Error accepting request:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Salon owner rejects a join request
 */
export const rejectJoinRequest = async (req, res) => {
  try {
    const ownerId = req.user.id;
    const { requestId } = req.params;
    const { reason } = req.body;

    // Get the request
    const joinRequest = await JoinRequest.findById(requestId);
    if (!joinRequest) {
      return res.status(404).json({ error: 'Request not found' });
    }

    // Verify owner owns this salon
    const salon = await Salon.findById(joinRequest.salonId);
    if (salon.ownerId.toString() !== ownerId) {
      return res.status(403).json({ error: 'Not authorized to reject this request' });
    }

    // Update request status
    joinRequest.status = 'rejected';
    joinRequest.respondedAt = new Date();
    joinRequest.respondedBy = ownerId;
    await joinRequest.save();

    res.json({
      success: true,
      message: 'Join request rejected',
      request: joinRequest
    });
  } catch (error) {
    console.error('Error rejecting request:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Barber views their own requests
 */
export const getMyRequests = async (req, res) => {
  try {
    const barberId = req.user.id;

    const requests = await JoinRequest.find({ barberId })
      .populate('salonId', 'name address');

    res.json({
      success: true,
      count: requests.length,
      requests
    });
  } catch (error) {
    console.error('Error fetching my requests:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Cancel a pending join request (barber only)
 */
export const cancelJoinRequest = async (req, res) => {
  try {
    const barberId = req.user.id;
    const { requestId } = req.params;

    const joinRequest = await JoinRequest.findById(requestId);
    if (!joinRequest) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (joinRequest.barberId.toString() !== barberId) {
      return res.status(403).json({ error: 'Not authorized to cancel this request' });
    }

    if (joinRequest.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending requests can be cancelled' });
    }

    await JoinRequest.findByIdAndDelete(requestId);

    res.json({
      success: true,
      message: 'Request cancelled'
    });
  } catch (error) {
    console.error('Error cancelling request:', error);
    res.status(500).json({ error: error.message });
  }
};
