// controllers/productController.js
import Product from "../schemas/productSchema.js";

/**
 * CREATE PRODUCT
 */
export const createProduct = async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;
    const { name, categoryId, sellingPrice, costPrice } = req.body;

    const product = await Product.create({
      restaurantId,
      name,
      categoryId,
      sellingPrice,
      costPrice,
    });

    res.status(201).json({
      success: true,
      data: product,
    });
  } catch (err) {
    console.error("Create product error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to create product",
    });
  }
};

/**
 * GET ALL PRODUCTS (with filters)
 */
export const getProducts = async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;
    const { search, categoryId, isActive } = req.query;

    const query = { restaurantId };

    if (categoryId) {
      query.categoryId = categoryId;
    }

    if (typeof isActive !== "undefined") {
      query.isActive = isActive === "true";
    }

    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    const products = await Product.find(query)
      .populate("categoryId", "name")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    console.error("Get products error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
    });
  }
};

/**
 * GET SINGLE PRODUCT
 */
export const getProductById = async (req, res) => {
  const { productId } = req.params;
  const restaurantId = req.user.restaurantId;

  const product = await Product.findOne({
    _id: productId,
    restaurantId,
  }).populate("categoryId", "name");

  if (!product) {
    return res.status(404).json({
      success: false,
      message: "Product not found",
    });
  }

  res.json({
    success: true,
    data: product,
  });
};

/**
 * UPDATE PRODUCT
 */
export const updateProduct = async (req, res) => {
  const { productId } = req.params;
  const restaurantId = req.user.restaurantId;

  const { name, categoryId, sellingPrice, costPrice, isActive } = req.body;

  const product = await Product.findOneAndUpdate(
    { _id: productId, restaurantId },
    { name, categoryId, sellingPrice, costPrice, isActive },
    { new: true }
  ).populate("categoryId", "name");

  if (!product) {
    return res.status(404).json({
      success: false,
      message: "Product not found",
    });
  }

  res.json({
    success: true,
    data: product,
  });
};

/**
 * SOFT DELETE PRODUCT
 */
export const deleteProduct = async (req, res) => {
  const { productId } = req.params;
  const restaurantId = req.user.restaurantId;

  const product = await Product.findOneAndUpdate(
    { _id: productId, restaurantId },
    { isActive: false },
    { new: true }
  );

  if (!product) {
    return res.status(404).json({
      success: false,
      message: "Product not found",
    });
  }

  res.json({
    success: true,
    message: "Product disabled successfully",
  });
};

/**
 * GET ACTIVE PRODUCTS (POS)
 */
export const getActiveProducts = async (req, res) => {
  const restaurantId = req.user.restaurantId;

  const products = await Product.find({
    restaurantId,
    isActive: true,
  })
    .populate("categoryId", "name")
    .sort({ name: 1 });

  res.json({
    success: true,
    data: products,
  });
};
