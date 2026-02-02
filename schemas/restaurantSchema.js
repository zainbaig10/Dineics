import mongoose from "mongoose";

const restaurantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    country: {
      type: String,
      enum: ["INDIA", "KSA"],
      required: true,
      immutable: true,
    },

    trn: {
      type: String,
      trim: true,
    },

    address: String,
    phone: String,

    isActive: {
      type: Boolean,
      default: true,
    },

    // 💰 PAYMENT CONFIG (ONLY INDIA USES UPI)
    paymentConfig: {
      upi: {
        enabled: {
          type: Boolean,
          default: false,
        },
        upiId: {
          type: String,
          trim: true,
        },
        qrString: {
          type: String, // full UPI QR payload
        },
      },
    },

    // 🧾 TAX CONFIG
    taxConfig: {
      enabled: {
        type: Boolean,
        default: false,
      },
      type: {
        type: String,
        enum: ["GST", "VAT"],
      },
      rate: Number,
      pricing: {
        type: String,
        enum: ["INCLUSIVE", "EXCLUSIVE"],
        default: "INCLUSIVE",
      },
    },
  },
  { timestamps: true }
);

export default mongoose.model("Restaurant", restaurantSchema);
