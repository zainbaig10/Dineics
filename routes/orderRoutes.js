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
  cancelOrder,
  requestCancelOrder,
  getRecentOrders,
  getPaymentModeSales,
  rejectCancelRequest,
  getOrdersByCategory,
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

OrderRouter.route("/dashboard/today").get(authenticateJWT, getTodayDashboard);

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

OrderRouter.route("/:orderId/cancel").post(authenticateJWT, cancelOrder);

OrderRouter.route("/:orderId/request-cancel").post(
  authenticateJWT,
  requestCancelOrder
);

OrderRouter.route("/recent").get(authenticateJWT, getRecentOrders);

OrderRouter.route("/payment-mode-sales").get(
  authenticateJWT,
  getPaymentModeSales
);

OrderRouter.route(
  "/:orderId/reject-cancel").patch(
  authenticateJWT,
  rejectCancelRequest
);

OrderRouter.route("/:categoryId/getOrdersbyCategory").get(
  authenticateJWT,
  getOrdersByCategory
)

export default OrderRouter;
