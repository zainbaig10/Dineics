import { body, validationResult } from "express-validator";

export const validateCreateRestaurant = [
  body("restaurant.name")
    .notEmpty()
    .withMessage("Restaurant name is required")
    .isLength({ min: 2 }),

  body("restaurant.country")
    .isIn(["INDIA", "KSA"])
    .withMessage("Country must be INDIA or KSA"),

  body("restaurant.phone")
    .notEmpty()
    .withMessage("Restaurant phone is required"),

  body("restaurant.address")
    .notEmpty()
    .withMessage("Restaurant address is required"),

  body("restaurant.trn")
    .optional()
    .isString()
    .withMessage("Invalid tax number"),

  body("restaurant.taxConfig.enabled")
    .optional()
    .isBoolean(),

  body("restaurant.taxConfig.rate")
    .optional()
    .isNumeric()
    .withMessage("Tax rate must be numeric"),

  body("restaurant.taxConfig.pricing")
    .optional()
    .isIn(["INCLUSIVE", "EXCLUSIVE"])
    .withMessage("Invalid tax pricing"),

  body("restaurant.paymentConfig.upi.enabled")
    .optional()
    .isBoolean(),

  body("restaurant.paymentConfig.upi.upiId")
    .if(body("restaurant.paymentConfig.upi.enabled").equals(true))
    .notEmpty()
    .withMessage("UPI ID is required when UPI is enabled"),

  body("restaurant.paymentConfig.upi.qrString")
    .if(body("restaurant.paymentConfig.upi.enabled").equals(true))
    .notEmpty()
    .withMessage("UPI QR string is required when UPI is enabled"),

  body("admin.name")
    .notEmpty()
    .withMessage("Admin name is required"),

  body("admin.email")
    .isEmail()
    .withMessage("Valid admin email required"),

  body("admin.password")
    .isLength({ min: 6 })
    .withMessage("Admin password must be at least 6 characters"),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array().map((e) => e.msg),
      });
    }
    next();
  },
];

export const validateUpdateRestaurant = [
  // -----------------------------
  // BASIC FIELDS
  // -----------------------------
  body("name")
    .optional()
    .trim()
    .isLength({ min: 2 })
    .withMessage("Restaurant name must be at least 2 characters"),

  body("address")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Address cannot be empty"),

  body("phone")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Phone cannot be empty"),

  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be boolean"),

  // -----------------------------
  // TAX CONFIG
  // -----------------------------
  body("taxConfig.enabled")
    .optional()
    .isBoolean()
    .withMessage("taxConfig.enabled must be boolean"),

  body("taxConfig.rate")
    .optional()
    .isNumeric()
    .withMessage("Tax rate must be a number"),

  body("taxConfig.pricing")
    .optional()
    .isIn(["INCLUSIVE", "EXCLUSIVE"])
    .withMessage("Invalid tax pricing"),

  // -----------------------------
  // TRN (KSA)
  // -----------------------------
  body("trn")
    .optional()
    .isString()
    .withMessage("Invalid TRN"),

  // -----------------------------
  // PAYMENT CONFIG (UPI)
  // -----------------------------
  body("paymentConfig.upi.enabled")
    .optional()
    .isBoolean()
    .withMessage("UPI enabled must be boolean"),

  body("paymentConfig.upi.upiId")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("UPI ID cannot be empty"),

  body("paymentConfig.upi.qrString")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("UPI QR string cannot be empty"),

  // -----------------------------
  // FINAL ERROR HANDLER
  // -----------------------------
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array().map((e) => e.msg),
      });
    }
    next();
  },
];