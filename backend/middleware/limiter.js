// In-memory rate limiting middleware
const rateLimitStore = {};

export function customRateLimiter(limit, windowMs) {
  return (req, res, next) => {
    const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress;
    const now = Date.now();
    
    if (!rateLimitStore[ip]) {
      rateLimitStore[ip] = [];
    }
    
    rateLimitStore[ip] = rateLimitStore[ip].filter(timestamp => now - timestamp < windowMs);
    
    if (rateLimitStore[ip].length >= limit) {
      return res.status(429).json({ error: 'Too many requests, please try again later.' });
    }
    
    rateLimitStore[ip].push(now);
    next();
  };
}
