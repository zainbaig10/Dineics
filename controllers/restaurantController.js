import Restaurant from "../schemas/restaurantSchema.js";
import User from "../schemas/userSchema.js";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import Settings from "../schemas/settingsSchema.js";

export const createRestaurant = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { restaurant, admin } = req.body;

    // -----------------------------
    // TAX CONFIG (OPT-IN ONLY)
    // -----------------------------
    let taxConfig = { enabled: false };

    if (restaurant.taxConfig?.enabled === true) {
      if (restaurant.country === "INDIA") {
        taxConfig = {
          enabled: true,
          type: "GST",
          rate: restaurant.taxConfig.rate ?? 5,
          pricing: restaurant.taxConfig.pricing ?? "EXCLUSIVE",
        };
      }

      if (restaurant.country === "KSA") {
        taxConfig = {
          enabled: true,
          type: "VAT",
          rate: restaurant.taxConfig.rate ?? 15,
          pricing: restaurant.taxConfig.pricing ?? "INCLUSIVE",
        };
      }
    }

    // -----------------------------
    // CREATE RESTAURANT
    // -----------------------------
    const [newRestaurant] = await Restaurant.create(
      [
        {
          ...restaurant,
          taxConfig, // 👈 single source of truth
        },
      ],
      { session }
    );

    // -----------------------------
    // CREATE ADMIN USER
    // -----------------------------
    const [adminUser] = await User.create(
      [
        {
          name: admin.name,
          email: admin.email,
          password: await bcrypt.hash(admin.password, 10),
          role: "ADMIN",
          restaurantId: newRestaurant._id,
        },
      ],
      { session }
    );

    // -----------------------------
    // CREATE SETTINGS
    // -----------------------------
    await Settings.create(
      [
        {
          restaurantId: newRestaurant._id,
          shopName: newRestaurant.name,
          address: newRestaurant.address,
          phone: newRestaurant.phone,
        },
      ],
      { session }
    );

    await session.commitTransaction();

    // -----------------------------
    // RESPONSE (IMPORTANT)
    // -----------------------------
    res.status(201).json({
      success: true,
      data: {
        restaurantId: newRestaurant._id,
        adminId: adminUser._id,
        taxConfig: newRestaurant.taxConfig, // 👈 VISIBILITY
      },
    });
  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
  }
};
