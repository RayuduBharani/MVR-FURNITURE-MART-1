import mongoose, { Schema, Document, Model } from "mongoose";

export type PurchaseStatus = "PAID" | "PENDING";

export interface IPurchase extends Document {
  _id: mongoose.Types.ObjectId;
  productId: mongoose.Types.ObjectId;
  quantity: number;
  pricePerUnit: number;
  total: number;
  supplierName: string;
  status: PurchaseStatus;
  initialPayment: number;
  paidAmount: number;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PurchaseSchema = new Schema<IPurchase>(
  {
    productId: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product ID is required"],
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      min: [1, "Quantity must be at least 1"],
    },
    pricePerUnit: {
      type: Number,
      required: [true, "Price per unit is required"],
      min: [0, "Price per unit cannot be negative"],
    },
    total: {
      type: Number,
      required: true,
      min: [0, "Total cannot be negative"],
    },
    supplierName: {
      type: String,
      required: [true, "Supplier name is required"],
      trim: true,
    },
    status: {
      type: String,
      enum: ["PAID", "PENDING"],
      default: "PAID",
    },
    initialPayment: {
      type: Number,
      default: 0,
      min: [0, "Initial payment cannot be negative"],
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: [0, "Paid amount cannot be negative"],
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
PurchaseSchema.index({ productId: 1 });
PurchaseSchema.index({ status: 1 });
PurchaseSchema.index({ date: -1 });

const Purchase: Model<IPurchase> =
  mongoose.models.Purchase || mongoose.model<IPurchase>("Purchase", PurchaseSchema);

export default Purchase;
