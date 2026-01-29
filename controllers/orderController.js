import Order from "../schemas/orderSchema.js";
import { generateInvoiceNumber } from "../utils/invoiceUtils.js";
import invoiceCounterSchema from "../schemas/invoiceCounterSchema.js";
import mongoose from "mongoose";
import { generateInvoiceHTML } from "../utils/invoiceTemplate.js";
import Restaurant from "../schemas/restaurantSchema.js";
import Product from "../schemas/productSchema.js";
import { parsePagination } from "../utils/responseHandlers.js";

export const createOrder = async (req, res) => {
  try {
    const { clientOrderId, items, paymentMode } = req.body;

    if (!req.user?.restaurantId) {
      return res.status(401).json({ success: false, msg: "Unauthorized" });
    }

    const restaurantId = req.user.restaurantId;

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ success: false, msg: "Restaurant not found" });
    }

    const existingOrder = await Order.findOne({ restaurantId, clientOrderId });
    if (existingOrder) {
      return res.status(200).json({ success: true, data: existingOrder });
    }

    let orderItems = [];
    let itemsTotal = 0;

    for (const item of items) {
      const product = await Product.findOne({
        _id: item.productId,
        restaurantId,
      });

      if (!product) {
        return res.status(404).json({
          success: false,
          msg: `Product not found: ${item.productId}`,
        });
      }

      const itemTotal = product.sellingPrice * item.quantity;
      itemsTotal += itemTotal;

      orderItems.push({
        productId: product._id,
        name: product.name,
        quantity: item.quantity,
        sellingPrice: product.sellingPrice,
        costPrice: product.costPrice || 0,
        total: itemTotal,
        profit:
          (product.sellingPrice - (product.costPrice || 0)) * item.quantity,
      });
    }

    let subtotal = itemsTotal;
    let taxAmount = 0;

    const taxConfig = restaurant.taxConfig;

    // ✅ APPLY TAX ONLY IF ENABLED
    if (taxConfig?.enabled === true) {
      if (taxConfig.pricing === "EXCLUSIVE") {
        taxAmount = (subtotal * taxConfig.rate) / 100;
      } else {
        taxAmount = (subtotal * taxConfig.rate) / (100 + taxConfig.rate);
        subtotal -= taxAmount;
      }
    }

    const grandTotal = subtotal + taxAmount;

    const order = await Order.create({
      restaurantId,
      clientOrderId,
      invoiceNumber: await generateInvoiceNumber(restaurantId),
      items: orderItems,
      subtotal,
      tax: {
        enabled: taxConfig?.enabled === true,
        taxType: taxConfig?.enabled ? taxConfig.type : null,
        rate: taxConfig?.enabled ? taxConfig.rate : null,
        inclusive:
          taxConfig?.enabled ? taxConfig.pricing === "INCLUSIVE" : null,
        amount: taxAmount,
      },
      grandTotal,
      paymentMode,
      createdBy: req.user.userId,
    });

    res.status(201).json({ success: true, data: order });
  } catch (err) {
    console.error("CREATE ORDER ERROR:", err);
    res.status(500).json({ success: false, msg: err.message });
  }
};

export const getAllOrders = async (req, res) => {
  try {
    const restaurantId = new mongoose.Types.ObjectId(req.user.restaurantId);

    const { page, pageSize, skip } = parsePagination(req.query);

    const {
      q,
      status,
      paymentMode,
      date,
      startDate,
      endDate,
      sortField = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const query = { restaurantId };

    // -------------------------
    // Status & Payment filters
    // -------------------------
    if (status) query.status = status;
    if (paymentMode) query.paymentMode = paymentMode;

    // -------------------------
    // Date filters
    // -------------------------
    if (date) {
      const dayStart = new Date(`${date}T00:00:00.000Z`);
      const dayEnd = new Date(dayStart.getTime() + 86400000);

      query.createdAt = { $gte: dayStart, $lt: dayEnd };
    } else if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) {
        query.createdAt.$gte = new Date(`${startDate}T00:00:00.000Z`);
      }
      if (endDate) {
        query.createdAt.$lt = new Date(
          new Date(`${endDate}T00:00:00.000Z`).getTime() + 86400000
        );
      }
    }

    // -------------------------
    // Search
    // -------------------------
    if (q) {
      query.$or = [
        { invoiceNumber: { $regex: q, $options: "i" } },
        { "items.name": { $regex: q, $options: "i" } },
        { paymentMode: { $regex: q, $options: "i" } },
      ];
    }

    const sort = {
      [sortField]: sortOrder === "asc" ? 1 : -1,
    };

    // -------------------------
    // Query + Count
    // -------------------------
    const [orders, total] = await Promise.all([
      Order.find(query)
        // 🔥 WHO requested cancel
        .populate("cancelRequestedBy", "name role")
        // 🔥 WHO cancelled (approved)
        .populate("cancelledBy", "name role")
        // 🔥 Optional: who created order
        .populate("createdBy", "name role")
        .sort(sort)
        .skip(skip)
        .limit(pageSize)
        .exec(),

      Order.countDocuments(query),
    ]);

    return res.json({
      success: true,
      data: orders,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (err) {
    console.error("Get orders error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
    });
  }
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
    // -------------------------
    // Auth check
    // -------------------------
    if (!req.user?.restaurantId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const restaurantId = new mongoose.Types.ObjectId(req.user.restaurantId);

    // -------------------------
    // UTC-safe today range
    // -------------------------
    const now = new Date();

    const startOfDayUTC = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        0,
        0,
        0,
        0
      )
    );

    const endOfDayUTC = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        23,
        59,
        59,
        999
      )
    );

    // -------------------------
    // Aggregation pipeline
    // -------------------------
    const pipeline = [
      {
        $match: {
          restaurantId,
          status: "PAID",
          createdAt: {
            $gte: startOfDayUTC,
            $lte: endOfDayUTC,
          },
        },
      },

      {
        $facet: {
          summary: [
            {
              $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                totalSales: {
                  $sum: {
                    $cond: [{ $isNumber: "$grandTotal" }, "$grandTotal", 0],
                  },
                },
              },
            },
          ],

          items: [
            { $unwind: { path: "$items", preserveNullAndEmptyArrays: true } },
            {
              $group: {
                _id: null,
                totalItemsSold: {
                  $sum: {
                    $cond: [
                      { $isNumber: "$items.quantity" },
                      "$items.quantity",
                      0,
                    ],
                  },
                },
                totalProfit: {
                  $sum: {
                    $cond: [{ $isNumber: "$items.profit" }, "$items.profit", 0],
                  },
                },
              },
            },
          ],
        },
      },

      {
        $project: {
          totalOrders: {
            $ifNull: [{ $arrayElemAt: ["$summary.totalOrders", 0] }, 0],
          },
          totalSales: {
            $ifNull: [{ $arrayElemAt: ["$summary.totalSales", 0] }, 0],
          },
          totalItemsSold: {
            $ifNull: [{ $arrayElemAt: ["$items.totalItemsSold", 0] }, 0],
          },
          totalProfit: {
            $ifNull: [{ $arrayElemAt: ["$items.totalProfit", 0] }, 0],
          },
        },
      },
    ];

    // -------------------------
    // Execute aggregation safely
    // -------------------------
    let result;
    try {
      result = await Order.aggregate(pipeline);
    } catch (aggErr) {
      console.error("Dashboard aggregation failed");
      console.error("Pipeline:", JSON.stringify(pipeline, null, 2));
      console.error("Error:", aggErr);
      throw aggErr;
    }

    // -------------------------
    // Response
    // -------------------------
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
    console.error("Dashboard Error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to load dashboard",
    });
  }
};

export const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!["ADMIN", "SUPER_ADMIN"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        msg: "Permission denied",
      });
    }

    const order = await Order.findOne({
      _id: orderId,
      restaurantId: req.user.restaurantId,
      status: "PAID",
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        msg: "Order not found or already cancelled",
      });
    }

    order.status = "CANCELLED";
    order.cancelledBy = req.user.userId;
    order.cancelledAt = new Date();
    order.cancelRequested = false;

    await order.save();

    res.json({
      success: true,
      msg: "Order cancelled successfully",
      data: order,
    });
  } catch (err) {
    console.error("Cancel order error:", err);
    res.status(500).json({
      success: false,
      msg: "Failed to cancel order",
    });
  }
};

export const requestCancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Only cashier can request cancel
    if (req.user.role !== "CASHIER") {
      return res.status(403).json({
        success: false,
        message: "Only cashier can request cancel",
      });
    }

    const order = await Order.findOne({
      _id: orderId,
      restaurantId: req.user.restaurantId,
      status: "PAID",
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found or already processed",
      });
    }

    if (order.cancelRequested) {
      return res.json({
        success: true,
        message: "Cancel request already sent",
      });
    }

    // ✅ REQUIRED FIELDS
    order.cancelRequested = true;
    order.cancelRequestedBy = req.user._id; // 👈 FIXED
    order.cancelRequestedAt = new Date();   // 👈 MISSING LINE

    await order.save();

    return res.json({
      success: true,
      message: "Cancel request sent to admin",
    });
  } catch (err) {
    console.error("Cancel request error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to request cancellation",
    });
  }
};

export const getRecentOrders = async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;

    if (!restaurantId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // 🔒 Safety limit (max 20)
    const limit = Math.min(parseInt(req.query.limit, 10) || 5, 20);

    const orders = await Order.find({
      restaurantId,
      status: { $ne: "REFUNDED" }, // exclude refunded
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select(
        "invoiceNumber grandTotal paymentMode status cancelRequested createdAt items"
      )
      .lean();

    // 🔁 Transform for POS UI
    const formatted = orders.map((order) => ({
      _id: order._id,
      invoiceNumber: order.invoiceNumber,
      amount: order.grandTotal,
      paymentMode: order.paymentMode,
      status: order.status,
      cancelRequested: order.cancelRequested,

      // ✅ FIX: sum of quantities, not unique items
      itemCount: order.items?.reduce(
        (sum, item) => sum + (item.quantity || 0),
        0
      ),

      createdAt: order.createdAt,
    }));

    return res.json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    console.error("Get recent orders error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch recent orders",
    });
  }
};

export const getPaymentModeSales = async (req, res) => {
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const stats = await Order.aggregate([
      {
        $match: {
          status: "PAID",
          createdAt: {
            $gte: startOfDay,
            $lte: endOfDay,
          },
        },
      },
      {
        $group: {
          _id: "$paymentMode",
          totalSales: { $sum: "$grandTotal" },
        },
      },
    ]);

    const result = {
      CASH: 0,
      CARD: 0,
      UPI: 0,
      MADA: 0,
    };

    stats.forEach((item) => {
      result[item._id] = item.totalSales;
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Today payment stats error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch today's payment mode stats",
    });
  }
};

export const rejectCancelRequest = async (req, res) => {
  try {
    const { orderId } = req.params;
    const adminId = req.user._id;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    if (!order.cancelRequested) {
      return res.status(400).json({
        success: false,
        message: "No cancel request to reject",
      });
    }

    order.cancelRequested = false;
    order.cancelRequestedBy = null;

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Cancel request rejected successfully",
    });
  } catch (error) {
    console.error("Reject cancel error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
    });
  }
};
