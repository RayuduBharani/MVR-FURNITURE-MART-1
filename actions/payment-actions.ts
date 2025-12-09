"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export type ActionResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

export type PaymentData = {
  id: string;
  purchaseId: string;
  productId: string;
  amount: number;
  paymentDate: string;
  paymentMethod?: string;
  notes?: string;
  createdAt: string;
};

// Helper to serialize payment
function serializePayment(payment: any): PaymentData {
  return {
    id: payment.id,
    purchaseId: payment.purchaseId,
    productId: payment.productId,
    amount: payment.amount,
    paymentDate: payment.paymentDate.toISOString(),
    paymentMethod: payment.paymentMethod || undefined,
    notes: payment.notes || undefined,
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
    const { purchaseId, amount, paymentDate, paymentMethod, notes } = formData;

    // Validations
    if (!amount || amount <= 0) {
      return { success: false, error: "Payment amount must be greater than 0" };
    }

    // Find purchase
    const purchase = await prisma.purchase.findUnique({
      where: { id: purchaseId },
    });
    
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
    const payment = await prisma.payment.create({
      data: {
        purchaseId,
        productId: purchase.productId,
        amount,
        paymentDate: paymentDate || new Date(),
        paymentMethod: paymentMethod?.trim(),
        notes: notes?.trim(),
      },
    });

    // Update purchase paidAmount
    const newPaidAmount = purchase.paidAmount + amount;
    const newStatus = newPaidAmount >= purchase.total ? "PAID" : purchase.status;

    await prisma.purchase.update({
      where: { id: purchaseId },
      data: {
        paidAmount: newPaidAmount,
        status: newStatus,
      },
    });

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
    const payments = await prisma.payment.findMany({
      where: { purchaseId },
      orderBy: { paymentDate: 'desc' },
    });

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
    const payments = await prisma.payment.findMany({
      where: { productId },
      orderBy: { paymentDate: 'desc' },
    });

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
    // Find payment first
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });
    
    if (!payment) {
      return { success: false, error: "Payment not found" };
    }

    // Get the purchase
    const purchase = await prisma.purchase.findUnique({
      where: { id: payment.purchaseId },
    });
    
    if (!purchase) {
      return { success: false, error: "Associated purchase not found" };
    }

    // Update purchase paidAmount
    const newPaidAmount = purchase.paidAmount - payment.amount;
    const newStatus = newPaidAmount < purchase.total && purchase.status === "PAID" ? "PENDING" : purchase.status;

    await prisma.purchase.update({
      where: { id: payment.purchaseId },
      data: {
        paidAmount: newPaidAmount,
        status: newStatus,
      },
    });

    // Delete payment
    await prisma.payment.delete({
      where: { id: paymentId },
    });

    revalidatePath("/stock");
    revalidatePath("/products");

    return { success: true };
  } catch (error) {
    console.error("Error deleting payment:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to delete payment";
    return { success: false, error: errorMessage };
  }
}
