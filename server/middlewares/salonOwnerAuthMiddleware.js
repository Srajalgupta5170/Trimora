import Salon from '../models/Salon.js';

// Verify that the salon owner is the user making the request
const verifySalonOwnerAccess = async (req, res, next) => {
  try {
    const salonId = req.params.salonId || req.body.salonId;
    const userId = req.user.id;

    if (!salonId) {
      return res.status(400).json({ message: 'Salon ID is required' });
    }

    const salon = await Salon.findById(salonId);
    if (!salon) {
      return res.status(404).json({ message: 'Salon not found' });
    }

    if (salon.ownerId.toString() !== userId) {
      return res.status(403).json({ 
        message: 'Not authorized: You can only manage your own salon' 
      });
    }

    req.salon = salon;
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export { verifySalonOwnerAccess };
export default verifySalonOwnerAccess;
