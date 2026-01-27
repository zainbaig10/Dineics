import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },

    // 🔒 Idempotency key (from frontend)
    clientOrderId: {
      type: String,
      required: true,
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
        profit: Number,
      },
    ],

    subtotal: Number,

    taxType: {
      type: String,
      enum: ["GST", "VAT", "NONE"],
      default: "NONE",
    },

    taxRate: Number,
    taxAmount: Number,

    grandTotal: {
      type: Number,
      required: true,
    },

    paymentMode: {
      type: String,
      enum: ["CASH", "CARD", "UPI", "MADA"],
      required: true,
    },

    status: {
      type: String,
      enum: ["PAID", "CANCELLED", "REFUNDED", "PENDING"],
      default: "PAID",
      index: true,
    },

    // 👇 NEW (for cashier flow)
    cancelRequested: {
      type: Boolean,
      default: false,
      index: true,
    },

    cancelRequestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    cancelRequestedAt: {
      type: Date,
    },
    
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    cancelledAt: Date,

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

// 🔐 No duplicate orders per restaurant
orderSchema.index({ restaurantId: 1, clientOrderId: 1 }, { unique: true });

export default mongoose.model("Order", orderSchema);
