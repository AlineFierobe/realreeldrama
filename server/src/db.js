import mongoose from 'mongoose';

// MongoDB connection. If it fails (network down, Atlas briefly unreachable…),
// the server keeps running and retries every 5 seconds until it succeeds.
// Meanwhile, the /api/health route reports the database as disconnected.
const RETRY_DELAY = 5000;

export async function connectDB(uri) {
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log('[db] Connected to MongoDB');
    return true;
  } catch (err) {
    console.error(`[db] Can't connect to MongoDB: ${err.message}`);
    console.error(`[db] Retrying in ${RETRY_DELAY / 1000} seconds…`);
    setTimeout(() => connectDB(uri), RETRY_DELAY);
    return false;
  }
}

// mongoose.connection.readyState values
const STATES = ['disconnected', 'connected', 'connecting', 'disconnecting'];

export function dbState() {
  return STATES[mongoose.connection.readyState] ?? 'unknown';
}
