import BarberProfile from '../models/BarberProfile.js';

// Verify that the barber belongs to the user making the request
const verifyBarberAccess = async (req, res, next) => {
  try {
    const barberId = req.params.barberId || req.body.barberId;
    const userId = req.user.id;

    if (!barberId) {
      return res.status(400).json({ message: 'Barber ID is required' });
    }

    const barber = await BarberProfile.findById(barberId);
    if (!barber || barber.userId.toString() !== userId) {
      return res.status(403).json({ 
        message: 'Not authorized: You can only access your own queue' 
      });
    }

    req.barber = barber;
    next();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export { verifyBarberAccess };
export default verifyBarberAccess;
