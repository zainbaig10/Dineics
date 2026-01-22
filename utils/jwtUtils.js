import jwt from "jsonwebtoken";

export const generateToken = (payload) => {
  return jwt.sign(
    {
      userId: payload.userId, // ✅ FIXED
      role: payload.role,
      restaurantId: payload.restaurantId || null,
      isSuperAdmin: payload.isSuperAdmin || false,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1y" }
  );
};

export const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    throw new Error("Invalid token");
  }
};
