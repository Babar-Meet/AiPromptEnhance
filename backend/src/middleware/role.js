export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.auth?.user)
      return res.status(401).json({ message: "Authentication required" });
    if (!roles.includes(req.auth.role))
      return res.status(403).json({ message: "Forbidden" });
    return next();
  };
}
