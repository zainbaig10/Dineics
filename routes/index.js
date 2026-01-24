import expressRouter from "express";
import userRouter from "./userRoutes.js";
import restaurantRouter from "./restaurantRoutes.js";
import productRouter from "./productRoutes.js";
import orderRouter from "./orderRoutes.js";
import settingRouter from "./settingsRoutes.js";
import categoryrouter from "./categoryRoutes.js";

const router = expressRouter();

router.use("/user", userRouter);
router.use("/restaurant", restaurantRouter);
router.use("/product", productRouter);
router.use("/order", orderRouter);
router.use("/setting", settingRouter);
router.use("/category", categoryrouter);

export default router;
