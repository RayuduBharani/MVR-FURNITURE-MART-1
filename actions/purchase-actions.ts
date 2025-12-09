/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { cache } from "react";

// Types for responses
export type ActionResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

export type PurchaseStatus = "PAID" | "PENDING";

export type PurchaseData = {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  pricePerUnit: number;
  total: number;
  supplierName: string;
  status: string;
  initialPayment: number;
  paidAmount: number;
  pendingAmount: number;
  date: string;
  createdAt: string;
  updatedAt: string;
};

export type PurchaseListItem = {
  id: string;
  date: string;
  supplierName: string;
  productName: string;
  productId: string;
  quantity: number;
  pricePerUnit: number;
  total: number;
  status: string;
  initialPayment: number;
  paidAmount: number;
  pendingAmount: number;
};

// Helper to serialize Prisma document
function serializePurchase(purchase: any, productName: string): PurchaseData {
  const paidAmount = purchase.paidAmount || purchase.initialPayment || (purchase.status === "PAID" ? purchase.total : 0);
  return {
    id: purchase.id,
    productId: purchase.productId,
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
    const { productId, quantity, pricePerUnit, supplierName, isPending, initialPayment } = formData;

    // Validations
    if (!quantity || quantity <= 0) {
      return { success: false, error: "Quantity must be greater than 0" };
    }

    if (pricePerUnit === undefined || pricePerUnit < 0) {
      return { success: false, error: "Price per unit must be 0 or greater" };
    }

    // Find product
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    
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
    const purchase = await prisma.purchase.create({
      data: {
        productId,
        quantity,
        pricePerUnit,
        total,
        supplierName: finalSupplierName,
        status,
        initialPayment: isPending ? (initialPayment || 0) : 0,
        paidAmount: paymentAmount,
        date: new Date(),
      },
    });

    // Update product stock
    await prisma.product.update({
      where: { id: productId },
      data: { stock: { increment: quantity } },
    });

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
export const getPurchases = cache(async function(
  status?: PurchaseStatus
): Promise<ActionResponse<PurchaseListItem[]>> {
  try {
    const where = status ? { status } : {};

    const purchases = await prisma.purchase.findMany({
      where,
      include: {
        product: {
          select: { name: true },
        },
      },
      orderBy: { date: 'desc' },
    });

    const data: PurchaseListItem[] = purchases.map((purchase) => {
      const paidAmount = purchase.paidAmount || purchase.initialPayment || (purchase.status === "PAID" ? purchase.total : 0);
      return {
        id: purchase.id,
        date: purchase.date.toISOString(),
        supplierName: purchase.supplierName,
        productId: purchase.productId,
        productName: purchase.product.name,
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
});

// GET PURCHASES BY PRODUCT
export const getPurchasesByProduct = cache(async function(
  productId: string
): Promise<ActionResponse<PurchaseListItem[]>> {
  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    
    if (!product) {
      return { success: false, error: "Product not found" };
    }

    const purchases = await prisma.purchase.findMany({
      where: { productId },
      orderBy: { date: 'desc' },
    });

    const data: PurchaseListItem[] = purchases.map((purchase) => {
      const paidAmount = purchase.paidAmount || purchase.initialPayment || (purchase.status === "PAID" ? purchase.total : 0);
      return {
        id: purchase.id,
        date: purchase.date.toISOString(),
        supplierName: purchase.supplierName,
        productId: purchase.productId,
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
});

// GET PENDING BILLS TOTAL (calculates total - paidAmount for pending purchases)
export const getPendingBillsTotal = cache(async function(): Promise<ActionResponse<number>> {
  try {
    const result = await prisma.purchase.aggregate({
      where: { status: "PENDING" },
      _sum: {
        total: true,
        paidAmount: true,
      },
    });

    const totalSum = result._sum.total || 0;
    const paidSum = result._sum.paidAmount || 0;
    const pendingTotal = totalSum - paidSum;

    return { success: true, data: pendingTotal };
  } catch (error) {
    console.error("Error fetching pending bills total:", error);
    return { success: false, error: "Failed to fetch pending bills total" };
  }
});

// MARK PURCHASE AS PAID
export async function markPurchaseAsPaid(id: string): Promise<ActionResponse> {
  try {
    const purchase = await prisma.purchase.findUnique({
      where: { id },
    });
    
    if (!purchase) {
      return { success: false, error: "Purchase not found" };
    }

    if (purchase.status === "PAID") {
      return { success: false, error: "Purchase is already marked as paid" };
    }

    await prisma.purchase.update({
      where: { id },
      data: {
        status: "PAID",
        paidAmount: purchase.total,
      },
    });

    revalidatePath("/stock");
    revalidatePath("/pending-bills");

    return { success: true };
  } catch (error) {
    console.error("Error marking purchase as paid:", error);
    return { success: false, error: "Failed to mark purchase as paid" };
  }
}

// GET TOTAL STOCK PURCHASED FOR A PRODUCT
export const getTotalStockPurchased = cache(async function(
  productId: string
): Promise<ActionResponse<number>> {
  try {
    const result = await prisma.purchase.aggregate({
      where: { productId },
      _sum: {
        quantity: true,
      },
    });

    const total = result._sum.quantity || 0;

    return { success: true, data: total };
  } catch (error) {
    console.error("Error fetching total stock purchased:", error);
    return { success: false, error: "Failed to fetch total stock purchased" };
  }
});

// GET PENDING PURCHASES WITH FILTERS (Optimized for Pending Bills page)
export const getPendingPurchasesWithFilters = cache(async function(
  dateFilter?: {
    type: "monthly" | "yearly" | "all";
    month?: string;
    year?: number;
  }
): Promise<ActionResponse<PurchaseListItem[]>> {
  try {
    const where: any = { status: "PENDING" };

    // Server-side date filtering
    if (dateFilter?.type === "monthly" && dateFilter.month) {
      const [year, month] = dateFilter.month.split("-");
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);
      where.date = { gte: startDate, lte: endDate };
    }

    if (dateFilter?.type === "yearly" && dateFilter.year !== undefined) {
      // Financial year: April to March
      const fyStart = new Date(dateFilter.year, 3, 1); // April 1st
      const fyEnd = new Date(dateFilter.year + 1, 2, 31, 23, 59, 59, 999); // March 31st
      where.date = { gte: fyStart, lte: fyEnd };
    }

    const purchases = await prisma.purchase.findMany({
      where,
      include: {
        product: {
          select: { name: true },
        },
      },
      orderBy: { date: 'desc' },
    });

    // Filter for pending amount > 0
    const data: PurchaseListItem[] = purchases
      .filter((purchase) => purchase.total - purchase.paidAmount > 0)
      .map((purchase) => {
        const paidAmount = purchase.paidAmount || 0;
        return {
          id: purchase.id,
          date: purchase.date.toISOString(),
          supplierName: purchase.supplierName,
          productId: purchase.productId,
          productName: purchase.product.name,
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
});

// GET PENDING BILLS SUMMARY STATS
export type PendingBillsStats = {
  totalPending: number;
  billCount: number;
  averageBill: number;
  bySupplier: { supplierName: string; totalPending: number; count: number }[];
};

export const getPendingBillsStats = cache(async function(
  dateFilter?: {
    type: "monthly" | "yearly" | "all";
    month?: string;
    year?: number;
  }
): Promise<ActionResponse<PendingBillsStats>> {
  try {
    const where: any = { status: "PENDING" };

    // Apply date filters
    if (dateFilter?.type === "monthly" && dateFilter.month) {
      const [year, month] = dateFilter.month.split("-");
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59, 999);
      where.date = { gte: startDate, lte: endDate };
    }

    if (dateFilter?.type === "yearly" && dateFilter.year !== undefined) {
      const fyStart = new Date(dateFilter.year, 3, 1);
      const fyEnd = new Date(dateFilter.year + 1, 2, 31, 23, 59, 59, 999);
      where.date = { gte: fyStart, lte: fyEnd };
    }

    // Fetch all pending purchases
    const purchases = await prisma.purchase.findMany({ where });

    // Filter for pending amount > 0 and calculate stats
    const pendingPurchases = purchases.filter(p => p.total - p.paidAmount > 0);
    
    let totalPending = 0;
    const supplierMap = new Map<string, { totalPending: number; count: number }>();

    pendingPurchases.forEach(purchase => {
      const pendingAmount = purchase.total - purchase.paidAmount;
      totalPending += pendingAmount;

      const supplierName = purchase.supplierName || "Unknown";
      const existing = supplierMap.get(supplierName) || { totalPending: 0, count: 0 };
      supplierMap.set(supplierName, {
        totalPending: existing.totalPending + pendingAmount,
        count: existing.count + 1,
      });
    });

    const count = pendingPurchases.length;
    const average = count > 0 ? totalPending / count : 0;

    const bySupplier = Array.from(supplierMap.entries())
      .map(([supplierName, stats]) => ({
        supplierName,
        totalPending: stats.totalPending,
        count: stats.count,
      }))
      .sort((a, b) => b.totalPending - a.totalPending);

    return {
      success: true,
      data: {
        totalPending,
        billCount: count,
        averageBill: average,
        bySupplier,
      },
    };
  } catch (error) {
    console.error("Error fetching pending bills stats:", error);
    return { success: false, error: "Failed to fetch pending bills stats" };
  }
});
