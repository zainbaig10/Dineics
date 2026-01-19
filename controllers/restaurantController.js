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

    const [newRestaurant] = await Restaurant.create(
      [
        {
          name: restaurant.name,
          country: restaurant.country,
          address: restaurant.address,
          phone: restaurant.phone,
          trn: restaurant.trn,
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

    // ✅ Auto-create settings (prefilled)
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
