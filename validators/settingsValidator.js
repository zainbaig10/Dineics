import { body, validationResult } from "express-validator";

const handleErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map((e) => e.msg),
    });
  }
  next();
};

export const validateUpdateSettings = [
  body("shopName").notEmpty().withMessage("Shop name is required"),

  body("taxNumber").optional().isString().withMessage("Invalid tax number"),

  body("phone").optional().isNumeric().withMessage("Invalid phone number"),

  body("address").optional().isString().withMessage("Invalid address"),

  handleErrors,
];
