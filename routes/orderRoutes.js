import express from "express";
import {
  createOrder,
  getAllOrders,
  getOrderById,
  getOrderByInvoice,
  markOrderPaid,
  getOrdersByDateRange,
  getSalesSummary,
  getPrintableInvoice,
  getTodayDashboard,
} from "../controllers/orderController.js";
import {
  validateCreateOrder,
  validateOrderId,
  validateInvoiceNumber,
  validateDateRange,
} from "../validators/orderValidator.js";
import { authenticateJWT } from "../middleware/authMiddleware.js";
const OrderRouter = express.Router();
OrderRouter.use(authenticateJWT);

OrderRouter.route("/create-order").post(validateCreateOrder, createOrder);

OrderRouter.route("/get-all-orders").get(getAllOrders);

OrderRouter.route("/get-order/:orderId").get(validateOrderId, getOrderById);

OrderRouter.route("/invoice/:invoiceNumber").get(
  authenticateJWT,
  validateInvoiceNumber,
  getOrderByInvoice
);

OrderRouter.route("/:orderId/mark-paid").patch(
  authenticateJWT,
  validateOrderId,
  markOrderPaid
);

OrderRouter.route("/date-range").get(
  authenticateJWT,
  validateDateRange,
  getOrdersByDateRange
);

OrderRouter.route("/dashboard/summary").get(authenticateJWT, getSalesSummary);

OrderRouter.route("/:orderId/invoice").get(
  authenticateJWT,
  getPrintableInvoice
);

OrderRouter.route("/today").get(authenticateJWT, getTodayDashboard);

export default OrderRouter;
