import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import Salon from './models/Salon.js';
import SalonMedia from './models/SalonMedia.js';

dotenv.config();

const checkSalonMedia = async () => {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    // Find Sagar Hair Salon
    const salonName = 'sagar hair salon';
    const salon = await Salon.findOne({ 
      name: { $regex: salonName, $options: 'i' } 
    });

    if (!salon) {
      console.log(`❌ Salon "${salonName}" not found`);
      const allSalons = await Salon.find({}, { name: 1 }).limit(5);
      console.log('Available salons:');
      allSalons.forEach(s => console.log(`  - ${s.name}`));
      process.exit(0);
    }

    console.log(`\n✅ Found Salon: ${salon.name} (ID: ${salon._id})`);

    // Check SalonMedia for this salon
    const media = await SalonMedia.findOne({ salonId: salon._id });

    if (!media) {
      console.log('❌ No SalonMedia document found for this salon');
      console.log('\nCreating empty SalonMedia document...');
      const newMedia = new SalonMedia({ salonId: salon._id });
      await newMedia.save();
      console.log('✅ Empty SalonMedia created');
    } else {
      console.log('✅ SalonMedia document found:');
      console.log('\n  Logo:', media.logo?.url ? 'YES ✅' : 'NO ❌');
      if (media.logo?.url) console.log('    URL:', media.logo.url);
      
      console.log('  Banner:', media.banner?.url ? 'YES ✅' : 'NO ❌');
      if (media.banner?.url) console.log('    URL:', media.banner.url);
      
      console.log('  Gallery Images:', media.gallery?.length || 0);
      if (media.gallery?.length > 0) {
        media.gallery.forEach((img, i) => {
          console.log(`    [${i+1}] ${img.url}`);
        });
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
};

checkSalonMedia();
