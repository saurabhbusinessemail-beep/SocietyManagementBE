import mongoose from 'mongoose';

// Cache the connection across serverless function invocations
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { 
    conn: null, 
    promise: null,
    connectionCount: 0 
  };
}

const MAX_CONNECTION_RETRIES = 3;
const CONNECTION_TIMEOUT_MS = 10000;

// Helper function to safely encode the password in connection string
function encodeMongoDBPassword(connectionString) {
  try {
    // Extract the password part and encode it
    const url = new URL(connectionString);
    
    if (url.password) {
      // Encode the password
      const encodedPassword = encodeURIComponent(url.password);
      
      // Reconstruct the URL with encoded password
      url.password = encodedPassword;
      
      // Return the encoded connection string
      return url.toString();
    }
    
    return connectionString;
  } catch (error) {
    console.warn('Could not parse connection string for encoding:', error.message);
    return connectionString;
  }
}

const database = async () => {
  // If already connected, return cached connection
  if (cached.conn) {
    return cached.conn;
  }

  // If connecting in progress, wait for it
  if (cached.promise) {
    return await cached.promise;
  }

  let DATABASE = process.env.NODE_ENV === 'test'
    ? process.env.DATABASE_TEST
    : process.env.DATABASE;

  if (!DATABASE) {
    throw new Error('DATABASE environment variable is not defined');
  }

  // Encode the password in the connection string
  DATABASE = encodeMongoDBPassword(DATABASE);
  
  // Connection options
  const options = {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: CONNECTION_TIMEOUT_MS,
    socketTimeoutMS: 45000,
    retryWrites: true,
    w: 'majority',
  };

  console.log('Attempting database connection...');

  cached.promise = mongoose.connect(DATABASE, options)
    .then((mongoose) => {
      console.log('✅ Successfully connected to the database');
      
      mongoose.connection.on('error', (err) => {
        console.error('Mongoose connection error:', err.message);
        cached.conn = null;
        cached.promise = null;
      });

      mongoose.connection.on('disconnected', () => {
        console.warn('Mongoose disconnected');
        cached.conn = null;
        cached.promise = null;
      });

      cached.conn = mongoose;
      return mongoose;
    })
    .catch((error) => {
      console.error('❌ Database connection failed:', error.message);
      cached.connectionCount++;
      cached.promise = null;
      
      if (cached.connectionCount >= MAX_CONNECTION_RETRIES) {
        console.warn(`Max connection retries reached. Resetting in 60s.`);
        setTimeout(() => {
          cached.connectionCount = 0;
        }, 60000);
      }
      
      throw error;
    });

  try {
    return await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }
};

export default database;