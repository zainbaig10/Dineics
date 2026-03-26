import express from "express";
import {
  createCategory,
  getCategories,
  getPublicCategories,
  toggleCategoryStatus,
  updateCategory,
} from "../controllers/categoryController.js";

import {
  validateCategoryStatus,
  validateCreateCategory,
  validateUpdateCategory,
} from "../validators/categoryValidator.js";

import { authenticateJWT, authorizeRoles } from "../middleware/authMiddleware.js";

const categoryrouter = express.Router();

categoryrouter.use(authenticateJWT);

categoryrouter
  .route("/create-category")
  .post(
    authenticateJWT,
    authorizeRoles("ADMIN"),
    validateCreateCategory,
    createCategory
  );

categoryrouter.route("/categories").get(authenticateJWT, getCategories);

categoryrouter
  .route("/:id")
  .patch(
    authenticateJWT,
    authorizeRoles("ADMIN"),
    validateUpdateCategory,
    updateCategory
  );

categoryrouter
  .route("/:id/status")
  .patch(
    authenticateJWT,
    authorizeRoles("ADMIN"),
    validateCategoryStatus,
    toggleCategoryStatus
  );
categoryrouter.route("/getPublicApis").get(authenticateJWT, getPublicCategories);
export default categoryrouter;
