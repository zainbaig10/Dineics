import { body, param, validationResult } from "express-validator";

export const validateCreateProduct = [
  body("name").notEmpty().withMessage("Product name is required"),

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
  body("sellingPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Selling price must be >= 0"),

  body("costPrice")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Cost price must be >= 0"),

  handleValidationErrors,
];

export const validateProductId = [
  param("productId").isMongoId().withMessage("Invalid product ID"),
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
