import express from "express";

import { createRestaurant, getRestaurantUpiConfig, updateRestaurant } from "../controllers/restaurantController.js";
import { validateCreateRestaurant } from "../validators/restaurantValidator.js";

import {
  authenticateJWT,
  authorizeRoles,
} from "../middleware/authMiddleware.js";

const restaurantRouter = express.Router();

restaurantRouter
  .route("/create-restaurant")
  .post(
    authenticateJWT,
    authorizeRoles("SUPER_ADMIN"),
    validateCreateRestaurant,
    createRestaurant
  );

 restaurantRouter
  .route("/update-restaurant")
  .patch(
    authenticateJWT,
    authorizeRoles("ADMIN"),
    updateRestaurant
  ); 

   restaurantRouter
  .route("/get-upi")
  .get(
    authenticateJWT,
    authorizeRoles("ADMIN"),
    getRestaurantUpiConfig
  ); 

export default restaurantRouter;
