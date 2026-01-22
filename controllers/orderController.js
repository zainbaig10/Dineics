import Order from "../schemas/orderSchema.js";
import { generateInvoiceNumber } from "../utils/invoiceUtils.js";
import invoiceCounterSchema from "../schemas/invoiceCounterSchema.js";
import mongoose from "mongoose";
import { generateInvoiceHTML } from "../utils/invoiceTemplate.js";
import Restaurant from "../schemas/restaurantSchema.js";
import Product from "../schemas/productSchema.js";
import { parsePagination } from "../utils/responseHandlers.js";

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
  try {
    const restaurantId = new mongoose.Types.ObjectId(
      req.user.restaurantId
    );

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

    const query = {
      restaurantId,
    };

    // -------------------------
    // Status & Payment filters
    // -------------------------
    if (status) query.status = status;
    if (paymentMode) query.paymentMode = paymentMode;

    // -------------------------
    // Date filters (createdAt)
    // -------------------------
    if (date) {
      const day = new Date(`${date}T00:00:00.000Z`);
      const nextDay = new Date(day.getTime() + 86400000);

      query.createdAt = { $gte: day, $lt: nextDay };
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
    // Query + Count in parallel
    // -------------------------
    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort(sort)
        .skip(skip)
        .limit(pageSize)
        .exec(),

      Order.countDocuments(query),
    ]);

    res.json({
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
    res.status(500).json({
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

    const restaurantId = new mongoose.Types.ObjectId(
      req.user.restaurantId
    );

    // -------------------------
    // UTC-safe today range
    // -------------------------
    const now = new Date();

    const startOfDayUTC = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        0, 0, 0, 0
      )
    );

    const endOfDayUTC = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        23, 59, 59, 999
      )
    );

    // -------------------------
    // Aggregation pipeline
    // -------------------------
    const pipeline = [
      {
        $match: {
          restaurantId,
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
                    $cond: [
                      { $isNumber: "$grandTotal" },
                      "$grandTotal",
                      0,
                    ],
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
                    $cond: [
                      { $isNumber: "$items.profit" },
                      "$items.profit",
                      0,
                    ],
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




