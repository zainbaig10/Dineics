import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },

    clientOrderId: {
      type: String,
      required: true,
    },

    invoiceNumber: {
      type: String,
      required: true,
    },

    items: [
      {
        productId: mongoose.Schema.Types.ObjectId,
        name: String,
        quantity: Number,
        sellingPrice: Number,
        costPrice: Number,
        total: Number,
        profit: Number,
      },
    ],

    subtotal: {
      type: Number,
      required: true,
    },

    tax: {
      enabled: { type: Boolean, default: false },
      taxType: { type: String },
      rate: { type: Number },
      inclusive: { type: Boolean },
      amount: { type: Number, default: 0 },
    },

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
      enum: ["PAID", "CANCELLED", "REFUNDED"],
      default: "PAID",
      index: true,
    },

    // 🔥 CANCEL REQUEST WORKFLOW (NEW)
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

    // 🔥 Final cancellation
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    cancelledAt: {
      type: Date,
    },

    cancelReason: {
      type: String,
      trim: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Prevent duplicate orders per POS
orderSchema.index({ restaurantId: 1, clientOrderId: 1 }, { unique: true });

export default mongoose.model("Order", orderSchema);
