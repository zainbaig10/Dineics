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
  const restaurantId = req.user.restaurantId;

  const { search, category, isActive, page = 1, limit = 20 } = req.query;

  const query = { restaurantId };

  if (category) query.category = category;
  if (isActive !== undefined) query.isActive = isActive === "true";

  if (search) {
    query.name = { $regex: search, $options: "i" };
  }

  const products = await Product.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  const total = await Product.countDocuments(query);

  res.json({
    success: true,
    data: products,
    meta: {
      total,
      page: Number(page),
      limit: Number(limit),
    },
  });
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
