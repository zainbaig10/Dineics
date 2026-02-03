// validators/categoryValidators.js
import { body } from "express-validator";

export const validateCreateCategory = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Category name is required")
    .isLength({ max: 50 })
    .withMessage("Category name too long"),

  body("color")
    .optional()
    .matches(/^#([0-9A-Fa-f]{6})$/)
    .withMessage("Invalid color hex code"),
];


export const validateUpdateCategory = [
  body("name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Category name cannot be empty")
    .isLength({ max: 50 })
    .withMessage("Category name too long"),

  body("color")
    .optional()
    .matches(/^#([0-9A-Fa-f]{6})$/)
    .withMessage("Invalid color hex code"),
];


export const validateCategoryStatus = [
  body("isActive")
    .isBoolean()
    .withMessage("isActive must be boolean"),
];
