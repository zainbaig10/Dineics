import { body, validationResult } from "express-validator";

/**
 * Validate Create Restaurant + First Admin
 * Used by SUPER_ADMIN only
 */
export const validateCreateRestaurant = [
  // ---- Restaurant fields ----
  body("restaurant.name")
    .notEmpty()
    .withMessage("Restaurant name is required")
    .isLength({ min: 2 })
    .withMessage("Restaurant name must be at least 2 characters"),

  body("restaurant.phone")
    .notEmpty()
    .withMessage("Restaurant phone is required")
    .isLength({ min: 8 })
    .withMessage("Enter a valid phone number"),

  body("restaurant.address")
    .notEmpty()
    .withMessage("Restaurant address is required"),

  body("restaurant.gstNumber")
    .optional()
    .isLength({ min: 5 })
    .withMessage("Invalid GST number"),

  // ---- Admin fields ----
  body("admin.name")
    .notEmpty()
    .withMessage("Admin name is required")
    .isLength({ min: 2 })
    .withMessage("Admin name must be at least 2 characters"),

  body("admin.email")
    .notEmpty()
    .withMessage("Admin email is required")
    .isEmail()
    .withMessage("Enter a valid admin email"),

  body("admin.password")
    .notEmpty()
    .withMessage("Admin password is required")
    .isLength({ min: 6 })
    .withMessage("Admin password must be at least 6 characters"),

  // ---- Final error handler ----
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
