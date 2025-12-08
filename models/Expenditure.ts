import mongoose, { Schema, Document, Model } from "mongoose";

export interface IExpenditure extends Document {
  _id: mongoose.Types.ObjectId;
  category: string;
  amount: number;
  notes?: string;
  date: Date;
  year: number;
  month: number;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenditureSchema = new Schema<IExpenditure>(
  {
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [1, "Amount must be at least 1"],
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    year: {
      type: Number,
      required: true,
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster filtering by year and month
ExpenditureSchema.index({ year: 1, month: 1 });
ExpenditureSchema.index({ date: -1 });

const Expenditure: Model<IExpenditure> =
  mongoose.models.Expenditure ||
  mongoose.model<IExpenditure>("Expenditure", ExpenditureSchema);

export default Expenditure;
