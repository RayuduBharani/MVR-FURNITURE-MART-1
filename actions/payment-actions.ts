"use server";

import connectDB from "@/lib/mongodb";
import Payment, { IPayment } from "@/models/Payment";
import Purchase from "@/models/Purchase";
import { revalidatePath } from "next/cache";
import mongoose from "mongoose";

export type ActionResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

export type PaymentData = {
  _id: string;
  purchaseId: string;
  productId: string;
  amount: number;
  paymentDate: string;
  paymentMethod?: string;
  notes?: string;
  createdAt: string;
};

// Helper to serialize payment
function serializePayment(payment: IPayment): PaymentData {
  return {
    _id: payment._id.toString(),
    purchaseId: payment.purchaseId.toString(),
    productId: payment.productId.toString(),
    amount: payment.amount,
    paymentDate: payment.paymentDate.toISOString(),
    paymentMethod: payment.paymentMethod,
    notes: payment.notes,
    createdAt: payment.createdAt.toISOString(),
  };
}

// ADD PAYMENT FOR A PURCHASE
export async function addPayment(formData: {
  purchaseId: string;
  amount: number;
  paymentDate?: Date;
  paymentMethod?: string;
  notes?: string;
}): Promise<ActionResponse<PaymentData>> {
  try {
    await connectDB();

    const { purchaseId, amount, paymentDate, paymentMethod, notes } = formData;

    // Validations
    if (!mongoose.Types.ObjectId.isValid(purchaseId)) {
      return { success: false, error: "Invalid purchase ID" };
    }

    if (!amount || amount <= 0) {
      return { success: false, error: "Payment amount must be greater than 0" };
    }

    // Find purchase
    const purchase = await Purchase.findById(purchaseId);
    if (!purchase) {
      return { success: false, error: "Purchase not found" };
    }

    // Check if total payment would exceed purchase amount
    const totalPaid = purchase.paidAmount + amount;
    if (totalPaid > purchase.total) {
      return {
        success: false,
        error: `Payment exceeds purchase amount. Remaining balance: ₹${(purchase.total - purchase.paidAmount).toFixed(2)}`,
      };
    }

    // Create payment record
    const payment = await Payment.create({
      purchaseId,
      productId: purchase.productId,
      amount,
      paymentDate: paymentDate || new Date(),
      paymentMethod: paymentMethod?.trim(),
      notes: notes?.trim(),
    });

    // Update purchase paidAmount
    purchase.paidAmount += amount;
    
    // If fully paid, update status
    if (purchase.paidAmount >= purchase.total) {
      purchase.status = "PAID";
    }
    
    await purchase.save();

    revalidatePath("/stock");
    revalidatePath("/products");
    revalidatePath("/pending-bills");

    return { success: true, data: serializePayment(payment) };
  } catch (error) {
    console.error("Error adding payment:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to add payment";
    return { success: false, error: errorMessage };
  }
}

// GET PAYMENTS FOR A PURCHASE
export async function getPaymentsByPurchase(
  purchaseId: string
): Promise<ActionResponse<PaymentData[]>> {
  try {
    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(purchaseId)) {
      return { success: false, error: "Invalid purchase ID" };
    }

    const payments = await Payment.find({ purchaseId })
      .sort({ paymentDate: -1 });

    return {
      success: true,
      data: payments.map(serializePayment),
    };
  } catch (error) {
    console.error("Error getting payments:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to get payments";
    return { success: false, error: errorMessage };
  }
}

// GET ALL PAYMENTS FOR A PRODUCT
export async function getPaymentsByProduct(
  productId: string
): Promise<ActionResponse<PaymentData[]>> {
  try {
    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return { success: false, error: "Invalid product ID" };
    }

    const payments = await Payment.find({ productId })
      .sort({ paymentDate: -1 });

    return {
      success: true,
      data: payments.map(serializePayment),
    };
  } catch (error) {
    console.error("Error getting payments:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to get payments";
    return { success: false, error: errorMessage };
  }
}

// DELETE PAYMENT
export async function deletePayment(
  paymentId: string
): Promise<ActionResponse<void>> {
  try {
    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(paymentId)) {
      return { success: false, error: "Invalid payment ID" };
    }

    // Find payment first
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return { success: false, error: "Payment not found" };
    }

    // Get the purchase
    const purchase = await Purchase.findById(payment.purchaseId);
    if (!purchase) {
      return { success: false, error: "Associated purchase not found" };
    }

    // Update purchase paidAmount
    purchase.paidAmount -= payment.amount;
    
    // If now unpaid and previously was PAID, revert to PENDING
    if (purchase.paidAmount < purchase.total && purchase.status === "PAID") {
      purchase.status = "PENDING";
    }
    
    await purchase.save();

    // Delete payment
    await Payment.deleteOne({ _id: paymentId });

    revalidatePath("/stock");
    revalidatePath("/products");

    return { success: true };
  } catch (error) {
    console.error("Error deleting payment:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to delete payment";
    return { success: false, error: errorMessage };
  }
}
