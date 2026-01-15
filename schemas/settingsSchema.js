import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      unique: true,
    },

    shopName: {
      type: String,
      trim: true,
    },

    taxNumber: {
      type: String,
      trim: true,
    },

    address: {
      type: String,
      trim: true,
    },

    phone: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Settings", settingsSchema);
