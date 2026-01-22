import express from "express";
import { validate } from "../middleware/validate.js";

import {
  validateLogin,
  validateCreateUser,
  validateResetPassword,
  validateChangePassword,
} from "../validators/userValidator.js";

import {
  login,
  createUser,
  resetCashierPassword,
  changePassword,
  initSuperAdmin,
} from "../controllers/userController.js";

import {
  authenticateJWT,
  authorizeRoles,
} from "../middleware/authMiddleware.js";

const userRouter = express.Router();

userRouter.route("/login").post(validateLogin, login);

userRouter
  .route("/create-user")
  .post(authenticateJWT, validateCreateUser, createUser);

userRouter
  .route("/reset-password")
  .post(authenticateJWT, validateResetPassword, resetCashierPassword);

userRouter
  .route("/change-password")
  .patch(authenticateJWT, validateChangePassword, changePassword);

userRouter.route("/init-super-admin").post(initSuperAdmin);

export default userRouter;
