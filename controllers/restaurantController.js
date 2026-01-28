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

    // 👇 Auto tax config based on country
    let taxConfig = { enabled: false };

    if (restaurant.country === "INDIA") {
      taxConfig = {
        enabled: true,
        type: "GST",
        rate: 5,
        pricing: "EXCLUSIVE",
      };
    }

    if (restaurant.country === "KSA") {
      taxConfig = {
        enabled: true,
        type: "VAT",
        rate: 15,
        pricing: "INCLUSIVE",
      };
    }

    const [newRestaurant] = await Restaurant.create(
      [
        {
          ...restaurant,
          taxConfig,
        },
      ],
      { session }
    );

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

    res.status(201).json({
      success: true,
      data: {
        restaurantId: newRestaurant._id,
        adminId: adminUser._id,
      },
    });
  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
  }
};
