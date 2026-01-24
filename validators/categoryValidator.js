// validators/categoryValidators.js
import { body } from "express-validator";

export const validateCreateCategory = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Category name is required")
    .isLength({ max: 50 })
    .withMessage("Category name too long"),
];

export const validateUpdateCategory = [
  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Category name cannot be empty")
    .isLength({ max: 50 })
    .withMessage("Category name too long"),
];


export const validateCategoryStatus = [
  body("isActive")
    .isBoolean()
    .withMessage("isActive must be boolean"),
];
