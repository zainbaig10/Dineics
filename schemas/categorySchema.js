// models/Category.js
import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

// prevent duplicates like Rice / rice
categorySchema.index(
  { restaurantId: 1, name: 1 },
  { unique: true }
);

export default mongoose.model("Category", categorySchema);
