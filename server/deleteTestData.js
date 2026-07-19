import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import User from './models/User.js';
import BarberProfile from './models/BarberProfile.js';
import Salon from './models/Salon.js';

dotenv.config();

const deleteTestData = async () => {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    // Delete test barber users
    const testBarberEmails = ['raj@barber.com', 'arjun@barber.com', 'vikram@barber.com'];
    const deletedBarbers = await User.deleteMany({ 
      email: { $in: testBarberEmails },
      role: 'barber'
    });
    console.log(`✅ Deleted ${deletedBarbers.deletedCount} test barber users`);

    // Delete test salon owner users (common test emails)
    const testSalonOwnerEmails = ['owner@salon.com', 'test@salon.com', 'salon@test.com'];
    const deletedSalonOwners = await User.deleteMany({ 
      email: { $in: testSalonOwnerEmails },
      role: 'salonOwner'
    });
    console.log(`✅ Deleted ${deletedSalonOwners.deletedCount} test salon owner users`);

    // Clean up orphaned barber profiles (profiles with no user)
    const allBarberProfiles = await BarberProfile.find();
    let orphanedCount = 0;
    for (const profile of allBarberProfiles) {
      const user = await User.findById(profile.userId);
      if (!user) {
        await BarberProfile.deleteOne({ _id: profile._id });
        orphanedCount++;
      }
    }
    console.log(`✅ Deleted ${orphanedCount} orphaned barber profiles`);

    // Delete demo and premium salons by name
    const deletedNamedSalons = await Salon.deleteMany({
      name: { $in: ['Demo Salon', 'Premium Salon', 'demo salon', 'premium salon'] }
    });
    console.log(`✅ Deleted ${deletedNamedSalons.deletedCount} named salons (Demo/Premium)`);

    // Clean up orphaned salons (salons with no owner)
    const allSalons = await Salon.find();
    let orphanedSalonCount = 0;
    for (const salon of allSalons) {
      if (salon.ownerId) {
        const owner = await User.findById(salon.ownerId);
        if (!owner) {
          await Salon.deleteOne({ _id: salon._id });
          orphanedSalonCount++;
        }
      }
    }
    console.log(`✅ Deleted ${orphanedSalonCount} orphaned salons`);

    console.log('\n✅ Test data cleanup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error deleting test data:', error.message);
    process.exit(1);
  }
};

deleteTestData();
