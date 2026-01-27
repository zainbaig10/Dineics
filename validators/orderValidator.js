import { body, param, validationResult, query } from "express-validator";

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

export const validateCreateOrder = [
  body("items").isArray({ min: 1 }).withMessage("Order items are required"),

  body("items.*.productId")
    .notEmpty()
    .withMessage("Product ID is required")
    .isMongoId()
    .withMessage("Invalid product ID"),

  body("items.*.quantity")
    .isInt({ min: 1 })
    .withMessage("Quantity must be at least 1"),

  body("paymentMode")
    .isIn(["CASH", "CARD", "UPI", "MADA"])
    .withMessage("Invalid payment mode"),

  body("taxType")
    .optional()
    .isIn(["GST", "VAT", "NONE"])
    .withMessage("Invalid tax type"),

  body("taxRate")
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Invalid tax rate"),

  handleErrors,
];

export const validateOrderId = [
  param("orderId").isMongoId().withMessage("Invalid order ID"),
  handleErrors,
];

export const validateInvoiceNumber = [
  param("invoiceNumber").notEmpty().withMessage("Invoice number is required"),
  handleErrors,
];

export const validateDateRange = [
  query("startDate").notEmpty().withMessage("Start date required"),
  query("endDate").notEmpty().withMessage("End date required"),
  handleErrors,
];
