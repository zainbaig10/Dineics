// validators/productValidators.js
import { body, param, query, validationResult } from "express-validator";

export const validateCreateProduct = [
  body("name")
    .notEmpty()
    .withMessage("Product name is required"),

  body("categoryId")
    .notEmpty()
    .withMessage("Category is required")
    .isMongoId()
    .withMessage("Invalid category ID"),

  body("sellingPrice")
    .notEmpty()
    .withMessage("Selling price is required")
    .isFloat({ min: 0 })
    .withMessage("Selling price must be >= 0"),

  body("costPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Cost price must be >= 0"),

  handleValidationErrors,
];

export const validateUpdateProduct = [
  body("name")
    .optional()
    .notEmpty()
    .withMessage("Product name cannot be empty"),

  body("categoryId")
    .optional()
    .isMongoId()
    .withMessage("Invalid category ID"),

  body("sellingPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Selling price must be >= 0"),

  body("costPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Cost price must be >= 0"),

  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be boolean"),

  handleValidationErrors,
];

export const validateProductId = [
  param("productId")
    .isMongoId()
    .withMessage("Invalid product ID"),

  handleValidationErrors,
];

export const validateGetProductsByCategory = [
  param("categoryId")
    .isMongoId()
    .withMessage("Invalid category ID"),

  query("activeOnly")
    .optional()
    .isIn(["true", "false"])
    .withMessage("activeOnly must be true or false"),

  handleValidationErrors,
];

function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map((e) => e.msg),
    });
  }
  next();
}
