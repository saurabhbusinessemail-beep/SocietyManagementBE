import mongoose from 'mongoose';

/**
 * Serverless-safe MongoDB connection manager for Mongoose 5.x + Atlas free tier.
 *
 * KEY FIXES vs prior version:
 *
 * 1. `bufferCommands: false` REMOVED.
 *    In Mongoose 5.x, this maps to `bufferMaxEntries: 0` in the MongoDB driver.
 *    It makes EVERY mongoose operation fail immediately if the connection isn't
 *    100% alive at the exact microsecond the op runs — even 1ms after our middleware
 *    resolves. This broke every single API call. Mongoose's default buffering
 *    (bufferCommands: true) is correct here: our `ensureDbConnected` middleware
 *    guarantees the connection is ready before `next()` is called, so buffering
 *    never actually blocks in practice.
 *
 * 2. Driver 3.x option names used (matches mongoose@5.x).
 *    mongoose@5.x bundles MongoDB driver 3.x. Driver 4.x / 5.x renamed options:
 *      WRONG (driver 4.x)   →   CORRECT (driver 3.x)
 *      maxPoolSize          →   poolSize
 *      minPoolSize          →   (not supported in 3.x; driver manages min internally)
 *      serverMonitoringMode →   (not supported in 3.x)
 *    Using the wrong names causes silent misconfiguration.
 *
 * 3. `useNewUrlParser: true` + `useUnifiedTopology: true` added.
 *    Without these Mongoose 5.x uses the legacy topology which does NOT reconnect
 *    properly after a Vercel freeze. The unified topology handles reconnection
 *    transparently via its heartbeat monitor.
 *
 * 4. State-clearing logic fixed.
 *    Old code cleared `cached.promise` when `readyState !== 1`, which killed
 *    in-progress connection attempts (readyState 2 = connecting). Fixed to only
 *    clear state when the connection is fully dead (readyState 0 = disconnected).
 */

// One global cache — Vercel reuses the same Node process across warm invocations
let cached = global._mongooseCache;
if (!cached) {
  cached = global._mongooseCache = { conn: null, promise: null };
}

/**
 * Normalize and encode the password portion of a MongoDB connection string.
 *
 * WHY decode → encode (idempotent normalization):
 *   Atlas connection strings already have the password percent-encoded.
 *   If we run encodeURIComponent directly on an already-encoded password,
 *   the % characters get double-encoded (%40 → %2540), so MongoDB receives
 *   the wrong password → "bad auth: authentication failed".
 *
 *   Normalizing first (decode then re-encode) is idempotent:
 *     - Raw password "p@ss":      decode("p@ss")      = "p@ss"    → encode → "p%40ss"  ✓
 *     - Pre-encoded "p%40ss":     decode("p%40ss")    = "p@ss"    → encode → "p%40ss"  ✓ (no double-encoding)
 *     - Invalid % "50%xyz":       decode throws       → encode raw "50%xyz" → "50%25xyz" ✓
 *
 *   Safe for all cases whether the DATABASE env var holds the raw connection
 *   string or the Atlas-provided one that already has encoding applied.
 */
function encodeMongoDBPassword(connectionString) {
  try {
    const protocolMatch = connectionString.match(/^(mongodb(?:\+srv)?:\/\/)/);
    if (!protocolMatch) return connectionString;

    const protocol = protocolMatch[1];
    const afterProtocol = connectionString.slice(protocol.length);

    // lastIndexOf('@') correctly handles passwords that contain '@'
    const lastAt = afterProtocol.lastIndexOf('@');
    if (lastAt === -1) return connectionString;

    const credentials = afterProtocol.slice(0, lastAt);
    const hostPart    = afterProtocol.slice(lastAt + 1);

    const firstColon = credentials.indexOf(':');
    if (firstColon === -1) return connectionString;

    const username    = credentials.slice(0, firstColon);
    const rawPassword = credentials.slice(firstColon + 1);

    // Normalize: decode any existing encoding, then re-encode exactly once.
    let encodedPassword;
    try {
      encodedPassword = encodeURIComponent(decodeURIComponent(rawPassword));
    } catch {
      // rawPassword contains an invalid % sequence (e.g. literal "50%")
      // Treat the whole thing as a raw string and encode it fresh.
      encodedPassword = encodeURIComponent(rawPassword);
    }

    return `${protocol}${username}:${encodedPassword}@${hostPart}`;
  } catch (err) {
    console.warn('[DB] Could not encode connection string password:', err.message);
    return connectionString;
  }
}

/**
 * readyState values (same across all mongoose/driver versions):
 *   0 = disconnected
 *   1 = connected
 *   2 = connecting
 *   3 = disconnecting
 */
function getReadyState() {
  return mongoose.connection.readyState;
}

const database = async () => {
  // Fast-path: fully connected and healthy
  if (cached.conn && getReadyState() === 1) {
    return cached.conn;
  }

  // If a connection attempt is already in flight, wait for it.
  // Do NOT clear cached.promise here — that would abort the in-progress connect.
  if (cached.promise) {
    try {
      return await cached.promise;
    } catch (err) {
      // The in-flight attempt failed; clear so next request retries
      cached.promise = null;
      throw err;
    }
  }

  // readyState 0 (disconnected) or 3 (disconnecting) → start fresh
  // readyState 2 (connecting) is handled above by cached.promise check
  cached.conn = null;

  let DATABASE = process.env.NODE_ENV === 'test'
    ? process.env.DATABASE_TEST
    : process.env.DATABASE;

  if (!DATABASE) {
    throw new Error('DATABASE environment variable is not defined');
  }

  DATABASE = encodeMongoDBPassword(DATABASE);

  /**
   * Connection options for Mongoose 5.x (MongoDB driver 3.x) on Atlas free tier.
   *
   * useNewUrlParser + useUnifiedTopology: required for proper reconnect behaviour.
   * poolSize: driver 3.x uses a single poolSize number (not min/max).
   * heartbeatFrequencyMS: how often the driver pings Atlas to keep sockets alive.
   *   Set to 10 s so Atlas (idle timeout ~30–60 s) never kills our sockets.
   * maxIdleTimeMS: retire idle pool connections after 25 s — before Atlas kills them.
   * serverSelectionTimeoutMS: how long to wait for a primary on connect / per-op.
   * socketTimeoutMS: per-socket operation timeout.
   * connectTimeoutMS: TCP + TLS handshake timeout.
   * retryWrites / w: Atlas replica set write semantics.
   */
  const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,

    // Pool — Atlas M0 allows 500 total connections shared across ALL clients
    poolSize: 5,

    // Timeouts
    serverSelectionTimeoutMS: 15000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 15000,

    // Keep sockets alive through Vercel freeze/thaw cycles
    heartbeatFrequencyMS: 10000,
    maxIdleTimeMS: 25000,

    // Write concerns
    retryWrites: true,
    w: 'majority',
  };

  console.log('[DB] Connecting to MongoDB...');

  cached.promise = mongoose
    .connect(DATABASE, options)
    .then((mongooseInstance) => {
      console.log('[DB] ✅ Connected to MongoDB');

      const conn = mongooseInstance.connection;

      conn.on('error', (err) => {
        console.error('[DB] Connection error:', err.message);
        cached.conn = null;
        cached.promise = null;
      });

      conn.on('disconnected', () => {
        console.warn('[DB] Disconnected from MongoDB');
        cached.conn = null;
        cached.promise = null;
      });

      conn.on('reconnected', () => {
        console.log('[DB] Reconnected to MongoDB');
        // Restore the cached conn reference so fast-path works again
        cached.conn = mongooseInstance;
      });

      cached.conn = mongooseInstance;
      return mongooseInstance;
    })
    .catch((err) => {
      console.error('[DB] ❌ Connection failed:', err.message);
      cached.promise = null;
      throw err;
    });

  return await cached.promise;
};

export default database;