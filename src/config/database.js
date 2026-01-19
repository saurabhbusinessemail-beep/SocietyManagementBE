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
const CONNECTION_TIMEOUT_MS = 10000; // 10 seconds

const database = async () => {
  // If already connected, return cached connection
  if (cached.conn) {
    console.log('Using cached database connection');
    return cached.conn;
  }

  // If connecting in progress, wait for it
  if (cached.promise) {
    console.log('Waiting for existing connection promise');
    return await cached.promise;
  }

  const DATABASE = process.env.NODE_ENV === 'test' ? process.env.DATABASE_TEST : process.env.DATABASE;

  if (!DATABASE) {
    throw new Error('DATABASE environment variable is not defined');
  }

  // Connection options optimized for serverless/vercel
  const options = {
    maxPoolSize: 10, // Adjust based on your needs
    minPoolSize: 0, // For serverless, keep at 0
    serverSelectionTimeoutMS: CONNECTION_TIMEOUT_MS,
    socketTimeoutMS: 45000, // Close idle connections after 45s
    family: 4, // Use IPv4, skip IPv6
    retryWrites: true,
    w: 'majority'
    // Remove deprecated options for Mongoose 6+
  };

  console.log(`Attempting database connection (attempt ${cached.connectionCount + 1})`);

  cached.promise = mongoose
    .connect(DATABASE, options)
    .then((mongoose) => {
      console.log('✅ Successfully connected to the database');

      // Connection event handlers
      mongoose.connection.on('error', (err) => {
        console.error('Mongoose connection error:', err);
        // Reset cache on error to force reconnection
        cached.conn = null;
        cached.promise = null;
      });

      mongoose.connection.on('disconnected', () => {
        console.warn('Mongoose disconnected');
        cached.conn = null;
        cached.promise = null;
      });

      mongoose.connection.on('reconnected', () => {
        console.log('Mongoose reconnected');
      });

      // Set connection state change listener
      mongoose.connection.on('connected', () => {
        console.log('Mongoose is connected');
        cached.connectionCount = 0; // Reset retry count on success
      });

      cached.conn = mongoose;
      return mongoose;
    })
    .catch((error) => {
      console.error('❌ Database connection failed:', error.message);

      // Increment retry count
      cached.connectionCount++;

      // Reset promise so next call can retry
      cached.promise = null;

      // If we've retried too many times, reset counter after delay
      if (cached.connectionCount >= MAX_CONNECTION_RETRIES) {
        console.warn(`Max connection retries (${MAX_CONNECTION_RETRIES}) reached. Will retry after cooldown.`);
        setTimeout(() => {
          cached.connectionCount = 0;
        }, 60000); // Reset after 60 seconds
      }

      throw error;
    });

  try {
    return await cached.promise;
  } catch (error) {
    // Ensure cache is cleared on failure
    cached.promise = null;
    throw error;
  }
};

// Optional: Add a health check function
export const checkDatabaseHealth = async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      // Try to ping the database
      await mongoose.connection.db.admin().ping();
      return { healthy: true, message: 'Database connected and responsive' };
    }
    return { healthy: false, message: 'Database not connected' };
  } catch (error) {
    return {
      healthy: false,
      message: `Database health check failed: ${error.message}`
    };
  }
};

// Optional: Graceful shutdown handler
const gracefulShutdown = async () => {
  try {
    await mongoose.connection.close();
    console.log('Mongoose connection closed through app termination');
    cached.conn = null;
    cached.promise = null;
  } catch (error) {
    console.error('Error during graceful shutdown:', error);
  }
};

// Listen for termination signals
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

export default database;
