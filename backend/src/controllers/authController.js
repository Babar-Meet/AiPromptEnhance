import bcrypt from "bcrypt";
import validator from "validator";
import { User } from "../models/User.js";
import { signToken } from "../utils/jwt.js";

export async function register(req, res, next) {
  try {
    const email = String(req.body.email || "")
      .toLowerCase()
      .trim();
    const password = String(req.body.password || "");

    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: "Invalid email" });
    }
    if (password.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters" });
    }

    const exists = await User.findOne({ email });
    if (exists)
      return res.status(409).json({ message: "Email already exists" });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, passwordHash, role: "free" });

    const token = signToken({ sub: user._id.toString(), role: user.role });
    res.status(201).json({
      token,
      user: { id: user._id, email: user.email, role: user.role },
    });
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const email = String(req.body.email || "")
      .toLowerCase()
      .trim();
    const password = String(req.body.password || "");

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: "Invalid credentials" });

    const token = signToken({ sub: user._id.toString(), role: user.role });
    res.json({
      token,
      user: { id: user._id, email: user.email, role: user.role },
    });
  } catch (error) {
    next(error);
  }
}
