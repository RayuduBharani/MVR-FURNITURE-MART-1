"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface ActionResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface CartItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface CreateSaleRequest {
  customerName: string;
  paymentType: "CASH" | "UPI" | "CARD" | "OTHER";
  pendingBill: boolean;
  initialPayment?: number;
  serialNumber?: string;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
}

export interface PaymentHistoryData {
  date: string;
  amount: number;
  paymentType: string;
}

export interface SaleItemData {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface SaleData {
  id: string;
  date: string;
  customerName: string;
  paymentType: string;
  status: string;
  totalAmount: number;
  initialPayment: number;
  balanceAmount: number;
  serialNumber?: string;
  paymentHistory: PaymentHistoryData[];
  items: SaleItemData[];
}

// Validate product and prepare cart item
export async function validateAndPrepareItem(
  productId: string,
  quantity: number
): Promise<ActionResponse<CartItem>> {
  try {
    if (!productId || quantity < 1) {
      return {
        success: false,
        error: "Invalid product ID or quantity",
      };
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    
    if (!product) {
      return {
        success: false,
        error: "Product not found",
      };
    }

    if (quantity > product.stock) {
      return {
        success: false,
        error: `Insufficient stock. Available: ${product.stock}`,
      };
    }

    const cartItem: CartItem = {
      productId: product.id,
      productName: product.name,
      quantity,
      price: product.sellingPrice,
      subtotal: quantity * product.sellingPrice,
    };

    return {
      success: true,
      data: cartItem,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to validate product";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

// Get product by name (for search functionality)
export async function searchProducts(
  searchQuery: string
): Promise<ActionResponse<Array<{ id: string; name: string; stock: number; sellingPrice: number }>>> {
  try {
    if (!searchQuery || searchQuery.length < 2) {
      return {
        success: false,
        error: "Search query must be at least 2 characters",
      };
    }

    const products = await prisma.product.findMany({
      where: {
        name: {
          contains: searchQuery,
          mode: 'insensitive',
        },
      },
      take: 10,
    });

    const data = products.map((p) => ({
      id: p.id,
      name: p.name,
      stock: p.stock,
      sellingPrice: p.sellingPrice,
    }));

    return {
      success: true,
      data,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to search products";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

// Create and save a sale
export async function createSale(request: CreateSaleRequest): Promise<ActionResponse<SaleData>> {
  try {
    console.log("CreateSale request received:", JSON.stringify(request, null, 2));

    // Validation
    if (!request.items || request.items.length === 0) {
      return {
        success: false,
        error: "Cart cannot be empty",
      };
    }

    if (!request.paymentType) {
      return {
        success: false,
        error: "Payment type is required",
      };
    }

    // Prepare sale items and validate stock
    const saleItemsData: SaleItemData[] = [];
    let totalAmount = 0;

    for (const item of request.items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        return {
          success: false,
          error: `Product ${item.productId} not found`,
        };
      }

      if (item.quantity < 1) {
        return {
          success: false,
          error: `Invalid quantity for ${product.name}`,
        };
      }

      if (item.quantity > product.stock) {
        return {
          success: false,
          error: `Insufficient stock for ${product.name}. Available: ${product.stock}`,
        };
      }

      const subtotal = item.quantity * product.sellingPrice;

      saleItemsData.push({
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        price: product.sellingPrice,
        subtotal,
      });

      totalAmount += subtotal;
    }

    if (totalAmount <= 0) {
      return {
        success: false,
        error: "Total amount must be greater than 0",
      };
    }

    // Determine status and calculate balance
    const initialPayment = request.initialPayment || 0;
    const balanceAmount = totalAmount - initialPayment;
    const status = balanceAmount > 0 ? "PENDING" : "PAID";

    // Create sale record with items and payment history
    const sale = await prisma.sale.create({
      data: {
        date: new Date(),
        customerName: request.customerName || "Walk-in",
        paymentType: request.paymentType,
        status,
        totalAmount,
        initialPayment,
        balanceAmount,
        serialNumber: request.serialNumber?.trim() || "",
        items: {
          create: saleItemsData.map(item => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.subtotal,
          })),
        },
        paymentHistory: initialPayment > 0 ? {
          create: [{
            date: new Date(),
            amount: initialPayment,
            paymentType: request.paymentType,
          }],
        } : undefined,
      },
      include: {
        items: true,
        paymentHistory: true,
      },
    });

    // Update product stock for all items
    for (const item of request.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: { decrement: item.quantity },
        },
      });
    }

    revalidatePath("/sales");
    revalidatePath("/stock");

    return {
      success: true,
      data: {
        id: sale.id,
        date: sale.date.toISOString(),
        customerName: sale.customerName,
        paymentType: sale.paymentType,
        status: sale.status,
        totalAmount: sale.totalAmount,
        initialPayment: sale.initialPayment,
        balanceAmount: sale.balanceAmount,
        serialNumber: sale.serialNumber,
        paymentHistory: sale.paymentHistory.map((payment) => ({
          date: payment.date.toISOString(),
          amount: payment.amount,
          paymentType: payment.paymentType,
        })),
        items: sale.items.map(item => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.subtotal,
        })),
      },
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to create sale";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

// Get all sales with optional filters
export async function getSales(
  filters?: {
    status?: "PAID" | "PENDING";
    startDate?: Date;
    endDate?: Date;
  }
): Promise<ActionResponse<SaleData[]>> {
  try {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.startDate || filters?.endDate) {
      where.date = {};
      if (filters.startDate) {
        where.date.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.date.lte = filters.endDate;
      }
    }

    const sales = await prisma.sale.findMany({
      where,
      include: {
        items: true,
        paymentHistory: true,
      },
      orderBy: { date: 'desc' },
    });

    const data = sales.map((sale) => ({
      id: sale.id,
      date: sale.date.toISOString(),
      customerName: sale.customerName,
      paymentType: sale.paymentType,
      status: sale.status,
      totalAmount: sale.totalAmount,
      initialPayment: sale.initialPayment || 0,
      balanceAmount: sale.balanceAmount || 0,
      serialNumber: sale.serialNumber,
      paymentHistory: sale.paymentHistory.map((payment) => ({
        date: payment.date.toISOString(),
        amount: payment.amount,
        paymentType: payment.paymentType,
      })),
      items: sale.items.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal,
      })),
    }));

    return {
      success: true,
      data,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch sales";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

// Get single sale by ID
export async function getSaleById(id: string): Promise<ActionResponse<SaleData>> {
  try {
    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        items: true,
        paymentHistory: true,
      },
    });
    
    if (!sale) {
      return {
        success: false,
        error: "Sale not found",
      };
    }

    return {
      success: true,
      data: {
        id: sale.id,
        date: sale.date.toISOString(),
        customerName: sale.customerName,
        paymentType: sale.paymentType,
        status: sale.status,
        totalAmount: sale.totalAmount,
        initialPayment: sale.initialPayment || 0,
        balanceAmount: sale.balanceAmount || 0,
        serialNumber: sale.serialNumber,
        paymentHistory: sale.paymentHistory.map((payment) => ({
          date: payment.date.toISOString(),
          amount: payment.amount,
          paymentType: payment.paymentType,
        })),
        items: sale.items.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.subtotal,
        })),
      },
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch sale";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

// Mark pending sale as paid
export async function markSaleAsPaid(id: string): Promise<ActionResponse<SaleData>> {
  try {
    const existingSale = await prisma.sale.findUnique({
      where: { id },
    });
    
    if (!existingSale) {
      return {
        success: false,
        error: "Sale not found",
      };
    }

    if (existingSale.status === "PAID") {
      return {
        success: false,
        error: "Sale is already paid",
      };
    }

    const updatedSale = await prisma.sale.update({
      where: { id },
      data: { status: "PAID" },
      include: {
        items: true,
        paymentHistory: true,
      },
    });

    revalidatePath("/sales");
    revalidatePath("/pending-bills");

    return {
      success: true,
      data: {
        id: updatedSale.id,
        date: updatedSale.date.toISOString(),
        customerName: updatedSale.customerName,
        paymentType: updatedSale.paymentType,
        status: updatedSale.status,
        totalAmount: updatedSale.totalAmount,
        initialPayment: updatedSale.initialPayment || 0,
        balanceAmount: updatedSale.balanceAmount || 0,
        serialNumber: updatedSale.serialNumber,
        paymentHistory: updatedSale.paymentHistory.map((payment) => ({
          date: payment.date.toISOString(),
          amount: payment.amount,
          paymentType: payment.paymentType,
        })),
        items: updatedSale.items.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.subtotal,
        })),
      },
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to update sale";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

// Get pending sales (for billing)
export async function getPendingSales(): Promise<ActionResponse<SaleData[]>> {
  try {
    const sales = await prisma.sale.findMany({
      where: { status: "PENDING" },
      include: {
        items: true,
        paymentHistory: true,
      },
      orderBy: { date: 'desc' },
    });

    const data = sales.map((sale) => ({
      id: sale.id,
      date: sale.date.toISOString(),
      customerName: sale.customerName,
      paymentType: sale.paymentType,
      status: sale.status,
      totalAmount: sale.totalAmount,
      initialPayment: sale.initialPayment || 0,
      balanceAmount: sale.balanceAmount || 0,
      serialNumber: sale.serialNumber,
      paymentHistory: sale.paymentHistory.map((payment) => ({
        date: payment.date.toISOString(),
        amount: payment.amount,
        paymentType: payment.paymentType,
      })),
      items: sale.items.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
        subtotal: item.subtotal,
      })),
    }));

    return {
      success: true,
      data,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch pending sales";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

// Make additional payment (EMI)
export async function makeAdditionalPayment(
  id: string,
  paymentAmount: number,
  paymentType?: string
): Promise<ActionResponse<SaleData>> {
  try {
    const sale = await prisma.sale.findUnique({
      where: { id },
    });
    
    if (!sale) {
      return {
        success: false,
        error: "Sale not found",
      };
    }

    if (sale.status === "PAID") {
      return {
        success: false,
        error: "Sale is already fully paid",
      };
    }

    if (paymentAmount <= 0) {
      return {
        success: false,
        error: "Payment amount must be greater than 0",
      };
    }

    if (paymentAmount > sale.balanceAmount) {
      return {
        success: false,
        error: `Payment amount cannot exceed balance of ₹${sale.balanceAmount}`,
      };
    }

    // Calculate new totals
    const newInitialPayment = sale.initialPayment + paymentAmount;
    const newBalanceAmount = sale.balanceAmount - paymentAmount;
    const newStatus = newBalanceAmount <= 0 ? "PAID" : sale.status;

    // Update sale and add payment history
    const updatedSale = await prisma.sale.update({
      where: { id },
      data: {
        initialPayment: newInitialPayment,
        balanceAmount: newBalanceAmount <= 0 ? 0 : newBalanceAmount,
        status: newStatus,
        paymentHistory: {
          create: {
            date: new Date(),
            amount: paymentAmount,
            paymentType: paymentType || sale.paymentType,
          },
        },
      },
      include: {
        items: true,
        paymentHistory: true,
      },
    });

    revalidatePath("/sales");
    revalidatePath("/pending-bills");

    return {
      success: true,
      data: {
        id: updatedSale.id,
        date: updatedSale.date.toISOString(),
        customerName: updatedSale.customerName,
        paymentType: updatedSale.paymentType,
        status: updatedSale.status,
        totalAmount: updatedSale.totalAmount,
        initialPayment: updatedSale.initialPayment || 0,
        balanceAmount: updatedSale.balanceAmount || 0,
        serialNumber: updatedSale.serialNumber,
        paymentHistory: updatedSale.paymentHistory.map((payment) => ({
          date: payment.date.toISOString(),
          amount: payment.amount,
          paymentType: payment.paymentType,
        })),
        items: updatedSale.items.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.subtotal,
        })),
      },
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to make payment";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

// Get sales statistics
export async function getSalesStats(): Promise<
  ActionResponse<{
    totalSales: number;
    totalRevenue: number;
    paidSales: number;
    pendingSales: number;
    pendingAmount: number;
  }>
> {
  try {
    const [totalCount, totalRevenue, paidCount, pendingCount, pendingAmount] = await Promise.all([
      prisma.sale.count(),
      prisma.sale.aggregate({
        _sum: {
          totalAmount: true,
        },
      }),
      prisma.sale.count({
        where: { status: "PAID" },
      }),
      prisma.sale.count({
        where: { status: "PENDING" },
      }),
      prisma.sale.aggregate({
        where: { status: "PENDING" },
        _sum: {
          totalAmount: true,
        },
      }),
    ]);

    return {
      success: true,
      data: {
        totalSales: totalCount,
        totalRevenue: totalRevenue._sum.totalAmount || 0,
        paidSales: paidCount,
        pendingSales: pendingCount,
        pendingAmount: pendingAmount._sum.totalAmount || 0,
      },
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch statistics";
    return {
      success: false,
      error: errorMessage,
    };
  }
}
