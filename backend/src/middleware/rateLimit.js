import { ROLE_LIMITS } from "../utils/constants.js";

const buckets = new Map();

function keyFor(req) {
  const ip = req.ip || req.headers["x-forwarded-for"] || "unknown";
  const userId = req.auth?.user?._id?.toString() || "guest";
  return `${ip}:${userId}`;
}

export function roleAwareLimiter(req, res, next) {
  const role = req.auth?.role || "guest";
  if (role === "admin") return next();

  const conf = ROLE_LIMITS[role] || ROLE_LIMITS.guest;
  const now = Date.now();
  const key = keyFor(req);
  const entry = buckets.get(key) || { count: 0, resetAt: now + conf.windowMs };

  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + conf.windowMs;
  }

  entry.count += 1;
  buckets.set(key, entry);

  if (entry.count > conf.requestCount) {
    return res
      .status(429)
      .json({
        message:
          "Rate limit exceeded. Please log in, upgrade to premium, or try again tomorrow.",
      });
  }

  return next();
}
