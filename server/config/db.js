import mongoose from 'mongoose';

// Try to use a real MongoDB URI; if it fails (or none provided)
// fall back to an in-memory MongoDB (mongodb-memory-server) for local testing.
const connectDB = async () => {
  const envUri = process.env.MONGO_URI;

  console.log('MONGO_URI from env:', envUri ? 'Set (hidden)' : 'Not set');

  // Helper to connect and log
  const doConnect = async (uri) => {
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  };

  // If an env URI is provided, try to connect to it first
  if (envUri) {
    try {
      await doConnect(envUri);
      return;
    } catch (err) {
      console.error('Failed to connect to provided MONGO_URI:', err.message);
      console.error('Falling back to in-memory MongoDB for local testing.');
    }
  }

  // Fallback: use mongodb-memory-server for local testing
  try {
    // Dynamically import to keep this as an optional dev-time dependency
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    const mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();

    // Keep the mongod instance alive by attaching to process for cleanup
    process.mongoMemoryServer = mongod;

    await doConnect(uri);
    console.log('Connected to in-memory MongoDB instance');
  } catch (err) {
    console.error('Failed to start in-memory MongoDB:', err);
    process.exit(1);
  }
};

export default connectDB;