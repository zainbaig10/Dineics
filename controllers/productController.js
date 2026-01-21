import Product from "../schemas/productSchema.js";

/**
 * CREATE PRODUCT
 */
export const createProduct = async (req, res) => {
  const restaurantId = req.user.restaurantId;

  const product = await Product.create({
    ...req.body,
    restaurantId,
  });

  res.status(201).json({
    success: true,
    data: product,
  });
};

/**
 * GET ALL PRODUCTS (with filters)
 */
export const getProducts = async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;
    const { search, category, isActive } = req.query;

    const query = {
      restaurantId,
    };

    // ---- category filter ----
    if (category) {
      query.category = category;
    }

    // ---- active / inactive filter ----
    if (typeof isActive !== "undefined") {
      query.isActive = isActive === "true";
    }

    // ---- search by product name ----
    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    const products = await Product.find(query).sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    console.error("Get products error:", error);
    return res.status(500).json({
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
  });

  if (!product) {
    return res.status(404).json({ msg: "Product not found" });
  }

  res.json({ success: true, data: product });
};

/**
 * UPDATE PRODUCT
 */
export const updateProduct = async (req, res) => {
  const { productId } = req.params;
  const restaurantId = req.user.restaurantId;

  const product = await Product.findOneAndUpdate(
    { _id: productId, restaurantId },
    req.body,
    { new: true }
  );

  if (!product) {
    return res.status(404).json({ msg: "Product not found" });
  }

  res.json({ success: true, data: product });
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
    return res.status(404).json({ msg: "Product not found" });
  }

  res.json({
    success: true,
    msg: "Product disabled successfully",
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
  }).sort({ name: 1 });

  res.json({ success: true, data: products });
};

export const getProductCategories = async (req, res, next) => {
  try {
    const { restaurantId } = req.user;

    const categories = await Product.distinct("category", {
      restaurantId,
      isActive: true,
    });

    res.json({
      success: true,
      data: categories,
    });
  } catch (err) {
    next(err);
  }
};