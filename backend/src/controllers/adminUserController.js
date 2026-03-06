import { User } from "../models/User.js";

export async function listUsers(req, res, next) {
  try {
    const users = await User.find({}, { passwordHash: 0 })
      .sort({ createdAt: -1 })
      .lean();
    res.json(users);
  } catch (error) {
    next(error);
  }
}

export async function updateUserRole(req, res, next) {
  try {
    const role = String(req.body.role || "");
    if (!["free", "paid", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, projection: { passwordHash: 0 } },
    );
    if (!updated) return res.status(404).json({ message: "User not found" });

    res.json(updated);
  } catch (error) {
    next(error);
  }
}
