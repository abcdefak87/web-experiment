const rateLimit = require('express-rate-limit');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Store for tracking user-specific rate limits
const userRateLimitStore = new Map();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of userRateLimitStore.entries()) {
    if (now > data.resetTime) {
      userRateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

// User-specific rate limiting middleware - DISABLED FOR DEVELOPMENT
const createUserRateLimit = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000,
    max = 10000,
    message = 'Too many requests from this user, please try again later.',
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    keyGenerator = (req) => req.user?.id || req.ip,
    onLimitReached = null
  } = options;

  return async (req, res, next) => {
    // DISABLED FOR DEVELOPMENT - ALWAYS ALLOW
    next();
  };
};

// Predefined rate limit configurations - ALL DISABLED
const rateLimits = {
  general: createUserRateLimit({ max: 10000 }),
  auth: createUserRateLimit({ max: 10000 }),
  upload: createUserRateLimit({ max: 10000 }),
  registration: createUserRateLimit({ max: 10000 }),
  whatsapp: createUserRateLimit({ max: 10000 }),
  jobCreation: createUserRateLimit({ max: 10000 }),
  customerOperations: createUserRateLimit({ max: 10000 }),
  reports: createUserRateLimit({ max: 10000 }),
  admin: createUserRateLimit({ max: 10000 }),
  strict: createUserRateLimit({ max: 10000 })
};

const getRateLimitStatus = (req, res, next) => next();
const resetUserRateLimit = (userId) => {};
const getUserRateLimitInfo = (userId) => ({ count: 0, remaining: 10000, isLimited: false });

module.exports = {
  createUserRateLimit,
  rateLimits,
  getRateLimitStatus,
  resetUserRateLimit,
  getUserRateLimitInfo
};
