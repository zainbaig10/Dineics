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
