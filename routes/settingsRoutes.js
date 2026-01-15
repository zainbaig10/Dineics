import express from "express";

import {
  getSettings,
  updateSettings,
} from "../controllers/settingsController.js";
import { authenticateJWT } from "../middleware/authmiddleware.js";
import { validateUpdateSettings } from "../validators/settingsValidator.js";

const settingsRouter = express.Router();

settingsRouter.use(authenticateJWT);

settingsRouter.route("/get-settings").get(getSettings);

settingsRouter
  .route("/update-settings")
  .patch(validateUpdateSettings, updateSettings);

export default settingsRouter;
