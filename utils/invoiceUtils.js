import InvoiceCounter from "../schemas/invoiceCounterSchema.js";

export const generateInvoiceNumber = async (restaurantId) => {
  const counter = await InvoiceCounter.findOneAndUpdate(
    { restaurantId },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  return `INV-${counter.seq.toString().padStart(6, "0")}`;
};
