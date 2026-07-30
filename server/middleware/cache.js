// Simple in-memory response cache middleware for semi-static GET endpoints
const memoryCache = new Map();

/**
 * Cache middleware
 * @param {number} ttlSeconds Time to live in seconds (default 300 = 5 minutes)
 */
const cacheMiddleware = (ttlSeconds = 300) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const key = req.originalUrl || req.url;
    const cachedResponse = memoryCache.get(key);

    if (cachedResponse && Date.now() < cachedResponse.expiry) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cachedResponse.data);
    }

    // Intercept res.json to store in cache
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        memoryCache.set(key, {
          data: body,
          expiry: Date.now() + ttlSeconds * 1000,
        });
      }
      res.setHeader('X-Cache', 'MISS');
      return originalJson(body);
    };

    next();
  };
};

/**
 * Clear cache by key prefix or clear all
 */
const clearCache = (keyPrefix = null) => {
  if (!keyPrefix) {
    memoryCache.clear();
    return;
  }
  for (const key of memoryCache.keys()) {
    if (key.startsWith(keyPrefix)) {
      memoryCache.delete(key);
    }
  }
};

module.exports = { cacheMiddleware, clearCache };
