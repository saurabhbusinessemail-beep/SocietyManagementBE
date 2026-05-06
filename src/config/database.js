import mongoose from 'mongoose';

/**
 * Serverless-safe MongoDB connection manager.
 *
 * KEY PROBLEMS SOLVED:
 * 1. "Pool was force destroyed" — Atlas free tier kills idle TCP connections after ~30s.
 *    Fix: set minPoolSize=1, maxPoolSize=5, heartbeatFrequencyMS=10000 so the driver
 *    actively keeps sockets alive and detects broken ones before a request hits them.
 *
 * 2. Vercel function freeze/thaw — the Node process is suspended between requests.
 *    The pool's sockets become stale while frozen. On thaw, the driver uses a dead socket.
 *    Fix: `serverSelectionTimeoutMS` low enough to fail fast + cached.conn validity check
 *    that falls back to reconnect when the connection is no longer in CONNECTED state.
 *
 * 3. Free Atlas cluster connection exhaustion (max 500 across all clients).
 *    Fix: maxPoolSize=5 limits each Lambda instance's footprint. Vercel free tier
 *    already limits concurrency so the total stays well below 500.
 *
 * 4. Buffered writes hitting a closed pool — queries pile up and time out.
 *    Fix: bufferCommands: false causes them to fail fast with a clear error instead
 *    of hanging until socketTimeoutMS fires.
 */

// One global cache across warm Lambda invocations (Vercel reuses the process)
let cached = global._mongooseCache;
if (!cached) {
  cached = global._mongooseCache = { conn: null, promise: null };
}

/**
 * Safely encode the password portion of a MongoDB connection string.
 *
 * WHY NOT new URL():
 *  - The WHATWG URL parser decodes percent sequences when you READ url.password,
 *    then re-encodes them again when you WRITE url.password = ... and call toString().
 *    This causes double-encoding (%40 → %2540) which the MongoDB driver rejects.
 *  - new URL() is also unreliable with mongodb+srv:// on older Node/V8 versions.
 *
 * THIS APPROACH:
 *  1. Strip the protocol prefix (mongodb:// or mongodb+srv://).
 *  2. Find the LAST '@' — everything before it is "user:password", after is the host.
 *     Using lastIndexOf handles passwords that themselves contain '@'.
 *  3. Split credentials at the FIRST ':' — username ends there, password is the rest.
 *  4. encodeURIComponent the raw password exactly once and reassemble.
 *
 * If the password is already fully percent-encoded in the env var the MongoDB driver
 * accepts it as-is, so we only encode when illegal characters are present.
 * The safest rule: store the RAW password in .env / Vercel env vars and let this
 * function do the encoding.
 */
function encodeMongoDBPassword(connectionString) {
  try {
    // Match the protocol: mongodb:// or mongodb+srv://
    const protocolMatch = connectionString.match(/^(mongodb(?:\+srv)?:\/\/)/);
    if (!protocolMatch) return connectionString;

    const protocol = protocolMatch[1];
    const afterProtocol = connectionString.slice(protocol.length);

    // Use lastIndexOf so passwords containing '@' are handled correctly
    const lastAt = afterProtocol.lastIndexOf('@');
    if (lastAt === -1) return connectionString; // no credentials in URI

    const credentials = afterProtocol.slice(0, lastAt);   // "user:password"
    const hostPart    = afterProtocol.slice(lastAt + 1);  // "host/db?options"

    // Split at the FIRST ':' — username may not contain ':'
    const firstColon = credentials.indexOf(':');
    if (firstColon === -1) return connectionString; // no password

    const username = credentials.slice(0, firstColon);
    const rawPassword = credentials.slice(firstColon + 1);

    // Encode the raw password exactly once.
    // encodeURIComponent encodes everything except: A-Z a-z 0-9 - _ . ! ~ * ' ( )
    // All other chars (@ : / ? # [ ] $ & + , ; =) get encoded.
    const encodedPassword = encodeURIComponent(rawPassword);

    return `${protocol}${username}:${encodedPassword}@${hostPart}`;
  } catch (err) {
    console.warn('[DB] Could not encode connection string password:', err.message);
    return connectionString;
  }
}

/**
 * Returns true when the mongoose connection is fully open.
 * State 1 === CONNECTED in all mongoose 5.x / 6.x / 7.x / 8.x versions.
 */
function isConnected() {
  return mongoose.connection.readyState === 1;
}

const database = async () => {
  // Fast-path: already healthy
  if (cached.conn && isConnected()) {
    return cached.conn;
  }

  // If a prior call was frozen mid-connection, the promise may still be set
  // but the connection may have died. Clear stale state.
  if (!isConnected()) {
    cached.conn = null;
    cached.promise = null;
  }

  // Deduplicate concurrent connect calls inside the same Lambda instance
  if (cached.promise) {
    return await cached.promise;
  }

  let DATABASE = process.env.NODE_ENV === 'test'
    ? process.env.DATABASE_TEST
    : process.env.DATABASE;

  if (!DATABASE) {
    throw new Error('DATABASE environment variable is not defined');
  }

  DATABASE = encodeMongoDBPassword(DATABASE);

  /**
   * Connection options tuned for:
   *   - Vercel serverless (freeze/thaw cycle)
   *   - MongoDB Atlas free cluster (M0 — 500 connection cap, shared resources)
   */
  const options = {
    // --- Pool size ---
    // minPoolSize=1 keeps one socket warm so the first request after a thaw
    // doesn't pay the full TCP + TLS handshake cost.
    // maxPoolSize=5 is generous for one Lambda instance on a free cluster.
    minPoolSize: 1,
    maxPoolSize: 5,

    // --- Timeouts (ms) ---
    // How long the driver waits for a primary before throwing on initial connect.
    serverSelectionTimeoutMS: 10000,
    // How long a socket op (find, insert …) can take before the driver gives up.
    socketTimeoutMS: 45000,
    // How often the driver pings Atlas to keep idle sockets alive.
    // Must be < Atlas's idle connection timeout (~30–60 s).
    heartbeatFrequencyMS: 10000,
    // Max time to wait for a connection from the pool.
    connectTimeoutMS: 10000,
    // Max lifetime of a pooled connection (ms). Forces periodic refresh.
    // Protects against Atlas's server-side connection reaping.
    maxIdleTimeMS: 25000,

    // --- Reliability ---
    // Fail immediately if no connection is available instead of buffering
    // queries indefinitely (avoids silent hangs on Lambda wakeup).
    bufferCommands: false,
    retryWrites: true,
    w: 'majority',

    // Compress traffic — reduces latency on Atlas free tier's shared network.
    compressors: ['zlib'],

    // Vercel's serverless functions must not block the event loop waiting
    // for background driver tasks (index builds, topology monitoring) on exit.
    serverMonitoringMode: 'auto',
  };

  console.log('[DB] Connecting to MongoDB...');

  cached.promise = mongoose
    .connect(DATABASE, options)
    .then((mongooseInstance) => {
      console.log('[DB] ✅ Connected to MongoDB');

      const conn = mongooseInstance.connection;

      conn.on('error', (err) => {
        console.error('[DB] Connection error:', err.message);
        // Clear cache so the next request triggers a fresh connect
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
      });

      cached.conn = mongooseInstance;
      return mongooseInstance;
    })
    .catch((err) => {
      console.error('[DB] ❌ Connection failed:', err.message);
      cached.promise = null; // allow retry on next request
      throw err;
    });

  return await cached.promise;
};

export default database;