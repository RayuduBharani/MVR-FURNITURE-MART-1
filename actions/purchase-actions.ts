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

// GET PENDING PURCHASES WITH FILTERS (Optimized for Pending Bills page)
export async function getPendingPurchasesWithFilters(
  dateFilter?: {
    type: "monthly" | "yearly" | "all";
    month?: string;
    year?: number;
  }
): Promise<ActionResponse<PurchaseListItem[]>> {
  try {
    await connectDB();

    const query: any = { status: "PENDING" };

    // Server-side date filtering
    if (dateFilter?.type === "monthly" && dateFilter.month) {
      const [year, month] = dateFilter.month.split("-");
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);
      query.date = { $gte: startDate, $lte: endDate };
    }

    if (dateFilter?.type === "yearly" && dateFilter.year !== undefined) {
      // Financial year: April to March
      const fyStart = new Date(dateFilter.year, 3, 1); // April 1st
      const fyEnd = new Date(dateFilter.year + 1, 2, 31, 23, 59, 59, 999); // March 31st
      query.date = { $gte: fyStart, $lte: fyEnd };
    }

    // Also filter for pending amount > 0
    query.$expr = { $gt: [{ $subtract: ["$total", "$paidAmount"] }, 0] };

    const purchases = await Purchase.find(query)
      .populate("productId", "name")
      .sort({ date: -1 });

    const data: PurchaseListItem[] = purchases.map((purchase) => {
      const paidAmount = purchase.paidAmount || 0;
      const populatedProduct = purchase.productId as unknown as { _id: any; name: string };
      return {
        _id: purchase._id.toString(),
        date: purchase.date.toISOString(),
        supplierName: purchase.supplierName,
        productId: populatedProduct._id?.toString() || purchase.productId.toString(),
        productName: populatedProduct?.name || "Unknown",
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
    console.error("Error fetching pending purchases:", error);
    return { success: false, error: "Failed to fetch pending purchases" };
  }
}

// GET PENDING BILLS SUMMARY STATS
export type PendingBillsStats = {
  totalPending: number;
  billCount: number;
  averageBill: number;
  bySupplier: { supplierName: string; totalPending: number; count: number }[];
};

export async function getPendingBillsStats(
  dateFilter?: {
    type: "monthly" | "yearly" | "all";
    month?: string;
    year?: number;
  }
): Promise<ActionResponse<PendingBillsStats>> {
  try {
    await connectDB();

    const matchQuery: any = { status: "PENDING" };

    // Apply date filters
    if (dateFilter?.type === "monthly" && dateFilter.month) {
      const [year, month] = dateFilter.month.split("-");
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);
      matchQuery.date = { $gte: startDate, $lte: endDate };
    }

    if (dateFilter?.type === "yearly" && dateFilter.year !== undefined) {
      const fyStart = new Date(dateFilter.year, 3, 1);
      const fyEnd = new Date(dateFilter.year + 1, 2, 31, 23, 59, 59, 999);
      matchQuery.date = { $gte: fyStart, $lte: fyEnd };
    }

    const [totalStats, supplierStats] = await Promise.all([
      // Total stats
      Purchase.aggregate([
        { $match: matchQuery },
        {
          $project: {
            pendingAmount: { $subtract: ["$total", "$paidAmount"] },
          },
        },
        { $match: { pendingAmount: { $gt: 0 } } },
        {
          $group: {
            _id: null,
            totalPending: { $sum: "$pendingAmount" },
            count: { $sum: 1 },
          },
        },
      ]),
      // By supplier
      Purchase.aggregate([
        { $match: matchQuery },
        {
          $project: {
            supplierName: 1,
            pendingAmount: { $subtract: ["$total", "$paidAmount"] },
          },
        },
        { $match: { pendingAmount: { $gt: 0 } } },
        {
          $group: {
            _id: "$supplierName",
            totalPending: { $sum: "$pendingAmount" },
            count: { $sum: 1 },
          },
        },
        { $sort: { totalPending: -1 } },
      ]),
    ]);

    const total = totalStats[0]?.totalPending || 0;
    const count = totalStats[0]?.count || 0;
    const average = count > 0 ? total / count : 0;

    const bySupplier = supplierStats.map((stat) => ({
      supplierName: stat._id || "Unknown",
      totalPending: stat.totalPending,
      count: stat.count,
    }));

    return {
      success: true,
      data: {
        totalPending: total,
        billCount: count,
        averageBill: average,
        bySupplier,
      },
    };
  } catch (error) {
    console.error("Error fetching pending bills stats:", error);
    return { success: false, error: "Failed to fetch pending bills stats" };
  }
}
