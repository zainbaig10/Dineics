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

    // ✅ TAX CONFIG (SOURCE OF TRUTH)
    taxConfig: {
      enabled: {
        type: Boolean,
        default: false,
      },

      type: {
        type: String,
        enum: ["GST", "VAT"],
      },

      rate: {
        type: Number, // 5, 15 etc
      },

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
