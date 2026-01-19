import Settings from "../schemas/settingsSchema.js";
import Restaurant from "../schemas/restaurantSchema.js";

export const getSettings = async (req, res, next) => {
  try {
    const { restaurantId } = req.user;

    const restaurant = await Restaurant.findById(restaurantId).select(
      "country"
    );

    if (!restaurant) {
      return res.status(404).json({
        success: false,
        message: "Restaurant not found",
      });
    }

    const settings = await Settings.findOne({ restaurantId });

    res.json({
      success: true,
      data: {
        ...settings.toObject(),
        country: restaurant.country,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const updateSettings = async (req, res, next) => {
  try {
    const { restaurantId } = req.user;

    const { shopName, taxNumber, address, phone } = req.body;

    const settings = await Settings.findOneAndUpdate(
      { restaurantId },
      {
        shopName,
        taxNumber,
        address,
        phone,
      },
      {
        new: true,
        upsert: true,
      }
    );

    res.json({
      success: true,
      data: settings,
    });
  } catch (err) {
    next(err);
  }
};
