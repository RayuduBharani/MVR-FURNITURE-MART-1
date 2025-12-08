import mongoose, { Schema, Document, Types } from "mongoose";

export interface ISaleItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface IPaymentHistory {
  date: Date;
  amount: number;
  paymentType: string;
}

export interface ISale extends Document {
  _id: Types.ObjectId;
  date: Date;
  customerName: string;
  paymentType: "CASH" | "UPI" | "CARD" | "OTHER";
  status: "PAID" | "PENDING";
  totalAmount: number;
  initialPayment: number;
  balanceAmount: number;
  serialNumber?: string;
  paymentHistory: IPaymentHistory[];
  items: ISaleItem[];
  createdAt: Date;
  updatedAt: Date;
}

const SaleSchema = new Schema<ISale>(
  {
    date: {
      type: Date,
      default: Date.now,
      required: true,
    },
    customerName: {
      type: String,
      default: "Walk-in",
      required: true,
    },
    paymentType: {
      type: String,
      enum: ["CASH", "UPI", "CARD", "OTHER"],
      required: true,
    },
    status: {
      type: String,
      enum: ["PAID", "PENDING"],
      default: "PAID",
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    initialPayment: {
      type: Number,
      default: 0,
      min: 0,
    },
    balanceAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    serialNumber: {
      type: String,
      default: "",
    },
    paymentHistory: [
      {
        _id: false,
        date: {
          type: Date,
          required: true,
          default: Date.now,
        },
        amount: {
          type: Number,
          required: true,
          min: 0,
        },
        paymentType: {
          type: String,
          required: true,
        },
      },
    ],
    items: [
      {
        _id: false,
        productId: {
          type: String,
          required: true,
        },
        productName: {
          type: String,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
        subtotal: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
SaleSchema.index({ date: -1 });
SaleSchema.index({ status: 1 });
SaleSchema.index({ customerName: 1 });
SaleSchema.index({ serialNumber: 1 });

// Delete the cached model if it exists to ensure schema updates are applied
if (mongoose.models.Sale) {
  delete mongoose.models.Sale;
}

export default mongoose.model<ISale>("Sale", SaleSchema);
