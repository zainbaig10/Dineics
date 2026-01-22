import { verifyToken } from "../utils/jwtUtils.js";

export const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      msg: "Authorization token missing",
    });
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = verifyToken(token);

    console.log("🔥 JWT PAYLOAD:", decoded); // 👈 ADD THIS

    req.user = decoded;
    next();
  } catch (err) {
    console.error("JWT ERROR:", err);
    return res.status(401).json({
      success: false,
      msg: "Invalid or expired token",
    });
  }
};


export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        msg: "Access denied",
      });
    }
    next();
  };
};
