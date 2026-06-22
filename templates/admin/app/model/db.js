const mongoose = require('mongoose');

let connectionPromise = null;

async function connectMongo(mongoConfig = {}) {
  const { uri, options = {} } = mongoConfig;
  const normalizedUri = typeof uri === 'string' ? uri.trim() : '';

  if (!normalizedUri) {
    console.warn('Mongo configuration missing, skip connecting.');
    return null;
  }
  if (connectionPromise) return connectionPromise;

  mongoose.set('strictQuery', true);
  connectionPromise = mongoose.connect(normalizedUri, options);

  mongoose.connection.on('connected', () => {
    console.log('[MongoDB] connected');
  });
  mongoose.connection.on('error', (err) => {
    console.error('[MongoDB] connection error:', err);
  });
  mongoose.connection.on('disconnected', () => {
    console.warn('[MongoDB] disconnected');
  });

  return connectionPromise;
}

module.exports = {
  connectMongo,
  mongoose
};
