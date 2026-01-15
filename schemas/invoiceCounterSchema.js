// models/InvoiceCounter.js
import mongoose from "mongoose";

const invoiceCounterSchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Restaurant",
    unique: true,
    required: true,
  },
  seq: {
    type: Number,
    default: 0,
  },
});

export default mongoose.model("InvoiceCounter", invoiceCounterSchema);
