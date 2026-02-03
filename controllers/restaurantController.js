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
    // KSA → TRN REQUIRED
    // -----------------------------
    if (restaurant.country === "KSA" && !restaurant.trn) {
      return res.status(400).json({
        success: false,
        msg: "VAT TRN is required for KSA restaurants",
      });
    }

    // -----------------------------
    // TAX CONFIG
    // -----------------------------
    let taxConfig = { enabled: false };

    if (restaurant.taxConfig?.enabled === true) {
      const pricing = ["INCLUSIVE", "EXCLUSIVE"].includes(
        restaurant.taxConfig.pricing
      )
        ? restaurant.taxConfig.pricing
        : undefined;

      if (restaurant.country === "INDIA") {
        taxConfig = {
          enabled: true,
          type: "GST",
          rate: restaurant.taxConfig.rate ?? 5,
          pricing: pricing ?? "EXCLUSIVE",
        };
      }

      if (restaurant.country === "KSA") {
        taxConfig = {
          enabled: true,
          type: "VAT",
          rate: restaurant.taxConfig.rate ?? 15,
          pricing: pricing ?? "INCLUSIVE",
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
      const { upiId, qrString } = restaurant.paymentConfig.upi;

      if (!upiId || !qrString) {
        return res.status(400).json({
          success: false,
          msg: "UPI ID and QR string are required when UPI is enabled",
        });
      }

      paymentConfig = {
        upi: {
          enabled: true,
          upiId,
          qrString,
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
          taxConfig,
          paymentConfig,
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

    return res.status(201).json({
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

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({
        success: false,
        msg: "Restaurant not found",
      });
    }

    const {
      name,
      address,
      phone,
      trn,
      taxConfig,
      paymentConfig,
      isActive,
    } = req.body;

    // -----------------------------
    // BASIC FIELDS
    // -----------------------------
    if (name !== undefined) restaurant.name = name.trim();
    if (address !== undefined) restaurant.address = address;
    if (phone !== undefined) restaurant.phone = phone;
    if (isActive !== undefined) restaurant.isActive = isActive;

    // -----------------------------
    // TAX CONFIG (STRICT)
    // -----------------------------
    if (taxConfig) {
      if (taxConfig.enabled === true) {
        if (restaurant.country === "INDIA") {
          restaurant.taxConfig = {
            enabled: true,
            type: "GST",
            rate: taxConfig.rate ?? 5,
            pricing: taxConfig.pricing ?? "EXCLUSIVE",
          };
        }

        if (restaurant.country === "KSA") {
          if (!trn && !restaurant.trn) {
            return res.status(400).json({
              success: false,
              msg: "VAT TRN is required to enable VAT in KSA",
            });
          }

          restaurant.taxConfig = {
            enabled: true,
            type: "VAT",
            rate: taxConfig.rate ?? 15,
            pricing: taxConfig.pricing ?? "INCLUSIVE",
          };
        }
      } else {
        // disable tax
        restaurant.taxConfig = { enabled: false };
      }
    }

    // -----------------------------
    // TRN UPDATE (KSA ONLY)
    // -----------------------------
    if (trn !== undefined) {
      if (restaurant.country !== "KSA") {
        return res.status(400).json({
          success: false,
          msg: "TRN is allowed only for KSA restaurants",
        });
      }
      restaurant.trn = trn;
    }

    // -----------------------------
    // PAYMENT CONFIG (UPI → INDIA ONLY)
    // -----------------------------
    if (paymentConfig?.upi) {
      if (restaurant.country !== "INDIA") {
        return res.status(400).json({
          success: false,
          msg: "UPI is allowed only for INDIA restaurants",
        });
      }

      if (paymentConfig.upi.enabled === true) {
        const { upiId, qrString } = paymentConfig.upi;

        if (!upiId || !qrString) {
          return res.status(400).json({
            success: false,
            msg: "UPI ID and QR string are required",
          });
        }

        restaurant.paymentConfig.upi = {
          enabled: true,
          upiId,
          qrString,
        };
      } else {
        restaurant.paymentConfig.upi = { enabled: false };
      }
    }

    await restaurant.save();

    res.json({
      success: true,
      data: restaurant,
    });
  } catch (err) {
    console.error("Update restaurant error:", err);
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

    const restaurant = await Restaurant.findById(
      restaurantId,
      {
        country: 1,
        paymentConfig: 1,
      }
    );

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

