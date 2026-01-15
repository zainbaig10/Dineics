// models/Order.js
import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },

    invoiceNumber: {
      type: String,
      required: true,
      index: true,
    },

    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        name: String,
        quantity: Number,
        sellingPrice: Number,
        costPrice: Number,
        total: Number,
        profit: Number, // ✅ REQUIRED
      },
    ],

    subtotal: {
      type: Number,
      required: true,
    },

    taxType: {
      type: String,
      enum: ["GST", "VAT", "NONE"],
      default: "NONE",
    },

    taxRate: {
      type: Number,
      default: 0, // 5, 12, 18 etc
    },

    taxAmount: {
      type: Number,
      default: 0,
    },

    grandTotal: {
      type: Number,
      required: true,
    },

    paymentMode: {
      type: String,
      enum: ["CASH", "CARD", "UPI"],
      required: true,
    },

    status: {
      type: String,
      enum: ["PAID", "CANCELLED", "REFUNDED", "PENDING"],
      default: "PAID",
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
