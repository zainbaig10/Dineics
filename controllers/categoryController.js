// controllers/categoryController.js
import Category from "../schemas/categorySchema.js";

export const createCategory = async (req, res, next) => {
  try {
    const { restaurantId } = req.user;
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        msg: "Category name is required",
      });
    }

    const category = await Category.create({
      restaurantId,
      name: name.trim(),
    });

    res.status(201).json({
      success: true,
      data: category,
    });
  } catch (err) {
    // duplicate category error
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        msg: "Category already exists",
      });
    }
    next(err);
  }
};

export const getCategories = async (req, res, next) => {
  try {
    const { restaurantId } = req.user;
    const { active } = req.query;

    const filter = { restaurantId };

    if (active === "true") {
      filter.isActive = true;
    }

    const categories = await Category.find(filter)
      .sort({ name: 1 })
      .lean();

    res.json({
      success: true,
      data: categories,
    });
  } catch (err) {
    next(err);
  }
};


export const updateCategory = async (req, res, next) => {
  try {
    const { restaurantId } = req.user;
    const { id } = req.params;
    const { name } = req.body;

    const category = await Category.findOneAndUpdate(
      { _id: id, restaurantId },
      { name: name.trim() },
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        msg: "Category not found",
      });
    }

    res.json({
      success: true,
      data: category,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        msg: "Category name already exists",
      });
    }
    next(err);
  }
};

export const toggleCategoryStatus = async (req, res, next) => {
  try {
    const { restaurantId } = req.user;
    const { id } = req.params;
    const { isActive } = req.body;

    const category = await Category.findOneAndUpdate(
      { _id: id, restaurantId },
      { isActive },
      { new: true }
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        msg: "Category not found",
      });
    }

    res.json({
      success: true,
      data: category,
    });
  } catch (err) {
    next(err);
  }
};


