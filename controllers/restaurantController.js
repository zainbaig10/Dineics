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
    // PAYMENT CONFIG (UPI → INDIA ONLY)
    // -----------------------------
    let paymentConfig = { upi: { enabled: false } };

    if (
      restaurant.country === "INDIA" &&
      restaurant.paymentConfig?.upi?.enabled === true
    ) {
      paymentConfig = {
        upi: {
          enabled: true,
          upiId: restaurant.paymentConfig.upi.upiId,
          qrString: restaurant.paymentConfig.upi.qrString,
        },
      };
    }

    // -----------------------------
    // CREATE RESTAURANT
    // -----------------------------
    const [newRestaurant] = await Restaurant.create(
      [
        {
          name: restaurant.name,
          country: restaurant.country,
          trn: restaurant.trn,
          address: restaurant.address,
          phone: restaurant.phone,
          isActive: true,
          taxConfig,        // 👈 SAME AS OLD
          paymentConfig,    // 👈 SAFE ADDITION
        },
      ],
      { session }
    );

    // -----------------------------
    // CREATE ADMIN USER
    // -----------------------------
    const hashedPassword = await bcrypt.hash(admin.password, 10);

    const [adminUser] = await User.create(
      [
        {
          name: admin.name,
          email: admin.email,
          password: hashedPassword,
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
    // RESPONSE
    // -----------------------------
    res.status(201).json({
      success: true,
      data: {
        restaurantId: newRestaurant._id,
        adminId: adminUser._id,
        taxConfig: newRestaurant.taxConfig,
        paymentConfig: newRestaurant.paymentConfig,
      },
    });
  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
  }
};


export const updateRestaurant = async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;

    if (!restaurantId) {
      return res.status(401).json({
        success: false,
        msg: "Unauthorized",
      });
    }

    const restaurant = await Restaurant.findByIdAndUpdate(
      restaurantId,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        msg: "Restaurant not found",
      });
    }

    res.json({
      success: true,
      data: restaurant,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      msg: err.message,
    });
  }
};

export const getRestaurantUpiConfig = async (req, res) => {
  try {
    const restaurantId = req.user?.restaurantId;

    if (!restaurantId) {
      return res.status(401).json({
        success: false,
        msg: "Unauthorized",
      });
    }

    const restaurant = await Restaurant.findById(restaurantId, {
      country: 1,
      paymentConfig: 1,
    });

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        msg: "Restaurant not found",
      });
    }

    // 🔒 UPI only for INDIA
    if (restaurant.country !== "INDIA") {
      return res.json({
        success: true,
        data: {
          enabled: false,
        },
      });
    }

    res.json({
      success: true,
      data: {
        enabled: restaurant.paymentConfig?.upi?.enabled === true,
        upiId: restaurant.paymentConfig?.upi?.upiId || null,
        qrString: restaurant.paymentConfig?.upi?.qrString || null,
      },
    });
  } catch (err) {
    next(err);
  }
};
