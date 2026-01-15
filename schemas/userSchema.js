// models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: function () {
        return this.role !== "SUPER_ADMIN";
      },
      index: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    role: {
      type: String,
      enum: ["SUPER_ADMIN", "ADMIN", "CASHIER"],
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Unique email per restaurant
userSchema.index(
  { restaurantId: 1, email: 1 },
  {
    unique: true,
    partialFilterExpression: { restaurantId: { $exists: true } },
  }
);

// Unique email for super admin
userSchema.index(
  { email: 1 },
  {
    unique: true,
    partialFilterExpression: { role: "SUPER_ADMIN" },
  }
);

export default mongoose.model("User", userSchema);
