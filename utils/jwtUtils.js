import jwt from "jsonwebtoken";

export const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user._id, // ✅ use userId everywhere
      role: user.role,
      restaurantId: user.restaurantId || null,
      isSuperAdmin: user.role === "SUPER_ADMIN",
    },
    process.env.JWT_SECRET,
    { expiresIn: "1y" }
  );
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new Error("Invalid token");
  }
};
