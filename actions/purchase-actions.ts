"use server";

import connectDB from "@/lib/mongodb";
import Product from "@/models/Product";
import Purchase, { IPurchase, PurchaseStatus } from "@/models/Purchase";
import { revalidatePath } from "next/cache";
import mongoose from "mongoose";

// Types for responses
export type ActionResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

export type PurchaseData = {
  _id: string;
  productId: string;
  productName: string;
  quantity: number;
  pricePerUnit: number;
  total: number;
  supplierName: string;
  status: PurchaseStatus;
  initialPayment: number;
  paidAmount: number;
  pendingAmount: number;
  date: string;
  createdAt: string;
  updatedAt: string;
};

export type PurchaseListItem = {
  _id: string;
  date: string;
  supplierName: string;
  productName: string;
  productId: string;
  quantity: number;
  pricePerUnit: number;
  total: number;
  status: PurchaseStatus;
  initialPayment: number;
  paidAmount: number;
  pendingAmount: number;
};

// Helper to serialize MongoDB document
function serializePurchase(purchase: IPurchase, productName: string): PurchaseData {
  const paidAmount = purchase.paidAmount || purchase.initialPayment || (purchase.status === "PAID" ? purchase.total : 0);
  return {
    _id: purchase._id.toString(),
    productId: purchase.productId.toString(),
    productName,
    quantity: purchase.quantity,
    pricePerUnit: purchase.pricePerUnit,
    total: purchase.total,
    supplierName: purchase.supplierName,
    status: purchase.status,
    initialPayment: purchase.initialPayment || 0,
    paidAmount: paidAmount,
    pendingAmount: purchase.total - paidAmount,
    date: purchase.date.toISOString(),
    createdAt: purchase.createdAt.toISOString(),
    updatedAt: purchase.updatedAt.toISOString(),
  };
}

// ADD PURCHASE (STOCK IN) - Creates purchase and updates product stock
export async function addPurchase(formData: {
  productId: string;
  quantity: number;
  pricePerUnit: number;
  supplierName?: string;
  isPending?: boolean;
  initialPayment?: number;
}): Promise<ActionResponse<PurchaseData>> {
  try {
    await connectDB();
    
    const { productId, quantity, pricePerUnit, supplierName, isPending, initialPayment } = formData;

    // Validations
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return { success: false, error: "Invalid product ID" };
    }

    if (!quantity || quantity <= 0) {
      return { success: false, error: "Quantity must be greater than 0" };
    }

    if (pricePerUnit === undefined || pricePerUnit < 0) {
      return { success: false, error: "Price per unit must be 0 or greater" };
    }

    // Find product
    const product = await Product.findById(productId);
    if (!product) {
      return { success: false, error: "Product not found" };
    }

    // Use supplier name from form or fall back to product's supplier name
    const finalSupplierName = supplierName?.trim() || product.supplierName || "Unknown";

    // Calculate total
    const total = quantity * pricePerUnit;
    const status: PurchaseStatus = isPending ? "PENDING" : "PAID";
    const paymentAmount = isPending ? (initialPayment || 0) : total;

    // Create purchase record
    const purchase = await Purchase.create({
      productId,
      quantity,
      pricePerUnit,
      total,
      supplierName: finalSupplierName,
      status,
      initialPayment: isPending ? (initialPayment || 0) : 0,
      paidAmount: paymentAmount,
      date: new Date(),
    });

    // Update product stock
    product.stock += quantity;
    await product.save();

    revalidatePath("/stock");
    revalidatePath("/products");

    return { success: true, data: serializePurchase(purchase, product.name) };
  } catch (error) {
    console.error("Error adding purchase:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to add purchase";
    return { success: false, error: errorMessage };
  }
}

// GET ALL PURCHASES
export async function getPurchases(
  status?: PurchaseStatus
): Promise<ActionResponse<PurchaseListItem[]>> {
  try {
    await connectDB();

    const query: { status?: PurchaseStatus } = {};
    if (status) {
      query.status = status;
    }

    const purchases = await Purchase.find(query)
      .populate("productId", "name")
      .sort({ date: -1 });

    const data: PurchaseListItem[] = purchases.map((purchase) => {
      const paidAmount = purchase.paidAmount || purchase.initialPayment || (purchase.status === "PAID" ? purchase.total : 0);
      return {
        _id: purchase._id.toString(),
        date: purchase.date.toISOString(),
        supplierName: purchase.supplierName,
        productId: purchase.productId.toString(),
        productName: (purchase.productId as unknown as { name: string })?.name || "Unknown",
        quantity: purchase.quantity,
        pricePerUnit: purchase.pricePerUnit,
        total: purchase.total,
        status: purchase.status,
        initialPayment: purchase.initialPayment || 0,
        paidAmount: paidAmount,
        pendingAmount: purchase.total - paidAmount,
      };
    });

    return { success: true, data };
  } catch (error) {
    console.error("Error fetching purchases:", error);
    return { success: false, error: "Failed to fetch purchases" };
  }
}

// GET PURCHASES BY PRODUCT
export async function getPurchasesByProduct(
  productId: string
): Promise<ActionResponse<PurchaseListItem[]>> {
  try {
    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return { success: false, error: "Invalid product ID" };
    }

    const product = await Product.findById(productId);
    if (!product) {
      return { success: false, error: "Product not found" };
    }

    const purchases = await Purchase.find({ productId }).sort({ date: -1 });

    const data: PurchaseListItem[] = purchases.map((purchase) => {
      const paidAmount = purchase.paidAmount || purchase.initialPayment || (purchase.status === "PAID" ? purchase.total : 0);
      return {
        _id: purchase._id.toString(),
        date: purchase.date.toISOString(),
        supplierName: purchase.supplierName,
        productId: purchase.productId.toString(),
        productName: product.name,
        quantity: purchase.quantity,
        pricePerUnit: purchase.pricePerUnit,
        total: purchase.total,
        status: purchase.status,
        initialPayment: purchase.initialPayment || 0,
        paidAmount: paidAmount,
        pendingAmount: purchase.total - paidAmount,
      };
    });

    return { success: true, data };
  } catch (error) {
    console.error("Error fetching purchases by product:", error);
    return { success: false, error: "Failed to fetch purchases" };
  }
}

// GET PENDING BILLS TOTAL (calculates total - paidAmount for pending purchases)
export async function getPendingBillsTotal(): Promise<ActionResponse<number>> {
  try {
    await connectDB();

    const result = await Purchase.aggregate([
      { $match: { status: "PENDING" } },
      { 
        $group: { 
          _id: null, 
          total: { 
            $sum: { 
              $subtract: ["$total", { $ifNull: ["$paidAmount", 0] }] 
            } 
          } 
        } 
      },
    ]);

    const total = result.length > 0 ? result[0].total : 0;

    return { success: true, data: total };
  } catch (error) {
    console.error("Error fetching pending bills total:", error);
    return { success: false, error: "Failed to fetch pending bills total" };
  }
}

// MARK PURCHASE AS PAID
export async function markPurchaseAsPaid(id: string): Promise<ActionResponse> {
  try {
    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return { success: false, error: "Invalid purchase ID" };
    }

    const purchase = await Purchase.findById(id);
    if (!purchase) {
      return { success: false, error: "Purchase not found" };
    }

    if (purchase.status === "PAID") {
      return { success: false, error: "Purchase is already marked as paid" };
    }

    purchase.status = "PAID";
    purchase.paidAmount = purchase.total;
    await purchase.save();

    revalidatePath("/stock");
    revalidatePath("/pending-bills");

    return { success: true };
  } catch (error) {
    console.error("Error marking purchase as paid:", error);
    return { success: false, error: "Failed to mark purchase as paid" };
  }
}

// GET TOTAL STOCK PURCHASED FOR A PRODUCT
export async function getTotalStockPurchased(
  productId: string
): Promise<ActionResponse<number>> {
  try {
    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return { success: false, error: "Invalid product ID" };
    }

    const result = await Purchase.aggregate([
      { $match: { productId: new mongoose.Types.ObjectId(productId) } },
      { $group: { _id: null, totalQuantity: { $sum: "$quantity" } } },
    ]);

    const total = result.length > 0 ? result[0].totalQuantity : 0;

    return { success: true, data: total };
  } catch (error) {
    console.error("Error fetching total stock purchased:", error);
    return { success: false, error: "Failed to fetch total stock purchased" };
  }
}
