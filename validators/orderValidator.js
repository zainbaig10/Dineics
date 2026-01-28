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
  body("items").isArray({ min: 1 }),
  body("items.*.productId").isMongoId(),
  body("items.*.quantity").isInt({ min: 1 }),
  body("paymentMode").isIn(["CASH", "CARD", "UPI", "MADA"]),
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
