import express from "express";

import { createRestaurant } from "../controllers/restaurantController.js";
import { validateCreateRestaurant } from "../validators/restaurantValidator.js";

import {
  authenticateJWT,
  authorizeRoles,
} from "../middleware/authmiddleware.js";

const restaurantRouter = express.Router();

restaurantRouter
  .route("/create-restaurant")
  .post(
    authenticateJWT,
    authorizeRoles("SUPER_ADMIN"),
    validateCreateRestaurant,
    createRestaurant
  );

export default restaurantRouter;
