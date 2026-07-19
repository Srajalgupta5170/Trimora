/**
 * Data Cleanup Script
 * 
 * This script cleans up test/old data from the database to ensure
 * a fresh, consistent state for production.
 * 
 * Usage: node scripts/cleanup.js
 */

import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import Queue from '../models/Queue.js';
import Appointment from '../models/Appointment.js';
import Service from '../models/Service.js';
import User from '../models/user.js';
import Salon from '../models/Salon.js';
import BarberProfile from '../models/BarberProfile.js';

dotenv.config();
connectDB();

const cleanup = async () => {
  try {
    console.log('🧹 Starting database cleanup...\n');

    // ===== OPTION 1: PARTIAL CLEANUP (Remove test data only) =====
    console.log('📊 Current database state:');
    console.log(`  Queue entries: ${await Queue.countDocuments()}`);
    console.log(`  Appointments: ${await Appointment.countDocuments()}`);
    console.log(`  Services: ${await Service.countDocuments()}`);
    console.log(`  Users: ${await User.countDocuments()}`);
    console.log(`  Salons: ${await Salon.countDocuments()}`);
    console.log(`  Barbers: ${await BarberProfile.countDocuments()}\n`);

    // Clear all queue entries (fresh start for positions)
    console.log('🗑️  Clearing Queue collection...');
    const queueDeleted = await Queue.deleteMany({});
    console.log(`  ✅ Deleted ${queueDeleted.deletedCount} queue entries\n`);

    // Clear old appointments
    console.log('🗑️  Clearing Appointment collection...');
    const appointmentDeleted = await Appointment.deleteMany({});
    console.log(`  ✅ Deleted ${appointmentDeleted.deletedCount} appointment entries\n`);

    // Clear services (can be re-added by barbers)
    console.log('🗑️  Clearing Service collection...');
    const serviceDeleted = await Service.deleteMany({});
    console.log(`  ✅ Deleted ${serviceDeleted.deletedCount} service entries\n`);

    // ===== OPTION 2: FULL CLEANUP (Remove all data - CAUTION) =====
    // Uncomment only if you want to start completely fresh
    /*
    console.log('⚠️  FULL CLEANUP MODE - Removing all data...\n');
    
    console.log('🗑️  Clearing all collections...');
    await User.deleteMany({});
    await Salon.deleteMany({});
    await BarberProfile.deleteMany({});
    await Queue.deleteMany({});
    await Appointment.deleteMany({});
    await Service.deleteMany({});
    
    console.log('  ✅ All collections cleared\n');
    */

    console.log('📊 Database state after cleanup:');
    console.log(`  Queue entries: ${await Queue.countDocuments()}`);
    console.log(`  Appointments: ${await Appointment.countDocuments()}`);
    console.log(`  Services: ${await Service.countDocuments()}`);
    console.log(`  Users: ${await User.countDocuments()}`);
    console.log(`  Salons: ${await Salon.countDocuments()}`);
    console.log(`  Barbers: ${await BarberProfile.countDocuments()}\n`);

    console.log('✅ Cleanup complete! Database is ready for fresh data.\n');
    console.log('📝 Next steps:');
    console.log('  1. Create a new salon owner account');
    console.log('  2. Register a salon');
    console.log('  3. Add barbers to the salon');
    console.log('  4. Create customer accounts');
    console.log('  5. Test the queue system\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
    process.exit(1);
  }
};

// Run cleanup
cleanup();
