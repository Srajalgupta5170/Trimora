import mongoose from "mongoose";

const connectDB = async () => {
  try {
    // Debug logging
    console.log("MONGO_URI from env:", process.env.MONGO_URI);
    
    // Use explicit connection string as fallback
    const mongoUri = process.env.MONGO_URI || 'mongodb+srv://srajalgupta5170_db_user:VsvB54HLGecySZNN@cluster0.b78eukr.mongodb.net/?appName=Cluster0';
    
    if (!mongoUri) {
      throw new Error('MONGO_URI not found in environment variables');
    }
    
    const conn = await mongoose.connect(mongoUri);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

export default connectDB;