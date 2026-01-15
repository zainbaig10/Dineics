import Order from "../schemas/orderSchema.js";
import { generateInvoiceNumber } from "../utils/invoiceUtils.js";
import invoiceCounterSchema from "../schemas/invoiceCounterSchema.js";
import mongoose from "mongoose";
import { generateInvoiceHTML } from "../utils/invoiceTemplate.js";
import Restaurant from "../schemas/restaurantSchema.js";
import Product from "../schemas/productSchema.js";

export const createOrder = async (req, res) => {
  const { items, paymentMode, taxType, taxRate } = req.body;
  const restaurantId = req.user.restaurantId;

  let orderItems = [];
  let subtotal = 0;
  let totalProfit = 0;

  for (const item of items) {
    const product = await Product.findOne({
      _id: item.productId,
      restaurantId,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        msg: "Product not found",
      });
    }

    const sellingPrice = product.sellingPrice;
    const costPrice = product.costPrice || 0;

    const itemTotal = sellingPrice * item.quantity;
    const itemProfit = (sellingPrice - costPrice) * item.quantity;

    subtotal += itemTotal;
    totalProfit += itemProfit;

    orderItems.push({
      productId: product._id,
      name: product.name,
      quantity: item.quantity,
      sellingPrice,
      costPrice,
      total: itemTotal,
      profit: itemProfit,
    });
  }

  const taxAmount = taxType === "NONE" ? 0 : (subtotal * taxRate) / 100;

  const grandTotal = subtotal + taxAmount;

  const invoiceNumber = await generateInvoiceNumber(restaurantId);

  const order = await Order.create({
    restaurantId,
    invoiceNumber,
    items: orderItems,
    subtotal,
    taxType,
    taxRate,
    taxAmount,
    grandTotal,
    paymentMode,
    status: "PAID",
    createdBy: req.user.userId,
  });

  res.status(201).json({
    success: true,
    data: order,
  });
};

export const getAllOrders = async (req, res) => {
  const restaurantId = req.user.restaurantId;

  const orders = await Order.find({ restaurantId }).sort({ createdAt: -1 });

  res.json({
    success: true,
    count: orders.length,
    data: orders,
  });
};

export const getOrderById = async (req, res) => {
  const { orderId } = req.params;
  const restaurantId = req.user.restaurantId;

  const order = await Order.findOne({
    _id: orderId,
    restaurantId,
  });

  if (!order) {
    return res.status(404).json({
      success: false,
      msg: "Order not found",
    });
  }

  res.json({
    success: true,
    data: order,
  });
};

export const getOrderByInvoice = async (req, res) => {
  const { invoiceNumber } = req.params;
  const restaurantId = req.user.restaurantId;

  const order = await Order.findOne({
    invoiceNumber,
    restaurantId,
  });

  if (!order) {
    return res.status(404).json({
      success: false,
      msg: "Order not found",
    });
  }

  res.json({
    success: true,
    data: order,
  });
};

export const markOrderPaid = async (req, res) => {
  const { orderId } = req.params;
  const restaurantId = req.user.restaurantId;

  const order = await Order.findOneAndUpdate(
    { _id: orderId, restaurantId },
    { orderStatus: "PAID" },
    { new: true }
  );

  if (!order) {
    return res.status(404).json({
      success: false,
      msg: "Order not found",
    });
  }

  res.json({
    success: true,
    msg: "Order marked as PAID",
    data: order,
  });
};

export const getOrdersByDateRange = async (req, res) => {
  const { startDate, endDate } = req.query;
  const restaurantId = req.user.restaurantId;

  const orders = await Order.find({
    restaurantId,
    createdAt: {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    },
  }).sort({ createdAt: -1 });

  res.json({
    success: true,
    count: orders.length,
    data: orders,
  });
};

export const getSalesSummary = async (req, res) => {
  const restaurantId = new mongoose.Types.ObjectId(req.user.restaurantId);

  const summary = await Order.aggregate([
    {
      $match: {
        restaurantId: restaurantId,
      },
    },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalSales: { $sum: "$grandTotal" },

        cashSales: {
          $sum: {
            $cond: [{ $eq: ["$paymentMode", "CASH"] }, "$grandTotal", 0],
          },
        },

        cardSales: {
          $sum: {
            $cond: [{ $eq: ["$paymentMode", "CARD"] }, "$grandTotal", 0],
          },
        },

        upiSales: {
          $sum: {
            $cond: [{ $eq: ["$paymentMode", "UPI"] }, "$grandTotal", 0],
          },
        },
      },
    },
  ]);

  res.json({
    success: true,
    data: summary[0] || {
      totalOrders: 0,
      totalSales: 0,
      cashSales: 0,
      cardSales: 0,
      upiSales: 0,
    },
  });
};

export const getPrintableInvoice = async (req, res) => {
  const { orderId } = req.params;
  const restaurantId = req.user.restaurantId;

  const order = await Order.findOne({
    _id: orderId,
    restaurantId,
  }).lean();

  if (!order) {
    return res.status(404).send("Invoice not found");
  }

  const restaurant = await Restaurant.findById(restaurantId).lean();

  const html = generateInvoiceHTML(order, restaurant);

  res.setHeader("Content-Type", "text/html");
  res.send(html);
};

export const getTodayDashboard = async (req, res) => {
  try {
    const restaurantId = new mongoose.Types.ObjectId(req.user.restaurantId);

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const result = await Order.aggregate([
      {
        $match: {
          restaurantId,
          createdAt: {
            $gte: startOfDay,
            $lte: endOfDay,
          },
        },
      },

      // Keep order-level fields safe
      {
        $project: {
          grandTotal: 1,
          items: 1,
        },
      },

      // Unwind items for item-level calculations
      { $unwind: "$items" },

      {
        $group: {
          _id: null,

          // Each order's grandTotal appears once per item,
          // so we must avoid double counting
          totalSales: { $sum: "$items.total" },

          totalProfit: {
            $sum: {
              $ifNull: ["$items.profit", 0],
            },
          },

          totalItemsSold: {
            $sum: {
              $ifNull: ["$items.quantity", 0],
            },
          },

          orderIds: { $addToSet: "$_id" }, // 👈 unique orders
        },
      },

      {
        $project: {
          _id: 0,
          totalSales: 1,
          totalProfit: 1,
          totalItemsSold: 1,
          totalOrders: { $size: "$orderIds" },
        },
      },
    ]);

    res.json({
      success: true,
      data: result[0] || {
        totalOrders: 0,
        totalSales: 0,
        totalItemsSold: 0,
        totalProfit: 0,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      msg: "Failed to load dashboard",
    });
  }
};
