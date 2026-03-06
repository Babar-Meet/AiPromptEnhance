import { verifyToken } from "../utils/jwt.js";
import { User } from "../models/User.js";
import { ROLES } from "../utils/constants.js";

function readBearerToken(req) {
  const value = req.headers.authorization || "";
  if (!value.startsWith("Bearer ")) return null;
  return value.slice("Bearer ".length);
}

export async function optionalAuth(req, res, next) {
  const token = readBearerToken(req);
  if (!token) {
    req.auth = { role: ROLES.GUEST, user: null };
    return next();
  }

  try {
    const payload = verifyToken(token);
    const user = await User.findById(payload.sub).lean();
    if (!user) {
      req.auth = { role: ROLES.GUEST, user: null };
      return next();
    }
    req.auth = { role: user.role, user };
    return next();
  } catch {
    req.auth = { role: ROLES.GUEST, user: null };
    return next();
  }
}

export async function requireAuth(req, res, next) {
  const token = readBearerToken(req);
  if (!token)
    return res.status(401).json({ message: "Authentication required" });

  try {
    const payload = verifyToken(token);
    const user = await User.findById(payload.sub).lean();
    if (!user) return res.status(401).json({ message: "Invalid token" });
    req.auth = { role: user.role, user };
    return next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}
