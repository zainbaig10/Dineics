// controllers/authController.js
import asyncHandler from "express-async-handler";
import bcrypt from "bcryptjs";
import User from "../schemas/userSchema.js";
import { generateToken } from "../utils/jwtUtils.js";
import Restaurant from "../schemas/restaurantSchema.js";

export const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  const { restaurantId } = req.user; // comes from JWT

  // Only ADMIN can create users
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({
      success: false,
      msg: "Only admin can create users",
    });
  }

  const existing = await User.findOne({
    restaurantId,
    email,
  }).lean();

  if (existing) {
    return res.status(409).json({
      success: false,
      msg: "User already exists",
    });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    restaurantId,
    name,
    email,
    password: hashedPassword,
    role: role || "CASHIER",
  });

  return res.status(201).json({
    success: true,
    msg: "User created successfully",
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user and populate restaurant (for response only)
    const user = await User.findOne({ email }).populate({
      path: "restaurantId",
      select: "name country trn address phone isActive",
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ msg: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ msg: "Invalid credentials" });
    }

    // ✅ CLEAN JWT PAYLOAD
    const tokenPayload = {
      userId: user._id.toString(),
      role: user.role,
      restaurantId: user.restaurantId?._id.toString(),
      isSuperAdmin: user.isSuperAdmin || false,
    };

    const token = generateToken(tokenPayload);

    res.json({
      success: true,
      data: {
        token,
        role: user.role,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          restaurant: user.restaurantId || null,
        },
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ msg: "Server error" });
  }
};

export const resetCashierPassword = async (req, res) => {
  const { email, newPassword } = req.body; // changed userId -> email
  const { restaurantId, role } = req.user;

  // Only ADMIN can reset cashier passwords
  if (role !== "ADMIN") {
    return res.status(403).json({ msg: "Only admin allowed" });
  }

  // Find cashier by email and restaurant
  const cashier = await User.findOne({
    email,
    restaurantId,
    role: "CASHIER",
  });

  if (!cashier) {
    return res.status(404).json({ msg: "Cashier not found" });
  }

  // Hash new password and save
  cashier.password = await bcrypt.hash(newPassword, 10);
  await cashier.save();

  res.json({ success: true, msg: "Password reset successfully" });
};

export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user.userId);

  if (!user) {
    return res.status(404).json({
      success: false,
      msg: "User not found",
    });
  }

  const ok = await bcrypt.compare(currentPassword, user.password);

  if (!ok) {
    return res.status(400).json({
      success: false,
      msg: "Incorrect current password",
    });
  }

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();

  res.json({
    success: true,
    msg: "Password updated",
  });
};

export const initSuperAdmin = async (req, res) => {
  if (req.headers["x-init-key"] !== process.env.INIT_SUPER_ADMIN_KEY) {
    return res.status(403).json({ msg: "Forbidden" });
  }

  const { name, email, password } = req.body;

  const exists = await User.findOne({ role: "SUPER_ADMIN" });
  if (exists) {
    return res.status(400).json({ msg: "Super admin already exists" });
  }

  const user = await User.create({
    name,
    email,
    password: await bcrypt.hash(password, 10),
    role: "SUPER_ADMIN",
  });

  res.status(201).json({
    success: true,
    msg: "Super admin created",
    data: { id: user._id, email: user.email },
  });
};
