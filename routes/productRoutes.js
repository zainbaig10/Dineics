import express from "express";
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getActiveProducts,
  getProductCategories,
} from "../controllers/productController.js";

import {
  validateCreateProduct,
  validateUpdateProduct,
  validateProductId,
} from "../validators/productValidator.js";

import { authenticateJWT } from "../middleware/authMiddleware.js";

const productRouter = express.Router();

productRouter.use(authenticateJWT);

productRouter.route("/categories").get(getProductCategories);
// Create
productRouter
  .route("/create-product")
  .post(validateCreateProduct, createProduct);

// List
productRouter.route("/get-products").get(getProducts);

// Active (POS)
productRouter.route("/active").get(getActiveProducts);

// Single
productRouter.route("/:productId").get(validateProductId, getProductById);

// Update
productRouter
  .route("/:productId")
  .put(validateProductId, validateUpdateProduct, updateProduct);

// Soft delete
productRouter.route("/:productId").delete(validateProductId, deleteProduct);



export default productRouter;
