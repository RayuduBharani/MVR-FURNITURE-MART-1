"use server";

import Sale, { ISaleItem } from "@/models/Sale";
import Product from "@/models/Product";
import connectDB from "@/lib/mongodb";

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

export interface SaleData {
  _id: string;
  date: string;
  customerName: string;
  paymentType: string;
  status: string;
  totalAmount: number;
  initialPayment: number;
  balanceAmount: number;
  serialNumber?: string;
  paymentHistory: PaymentHistoryData[];
  items: ISaleItem[];
}

// Validate product and prepare cart item
export async function validateAndPrepareItem(
  productId: string,
  quantity: number
): Promise<ActionResponse<CartItem>> {
  try {
    await connectDB();

    if (!productId || quantity < 1) {
      return {
        success: false,
        error: "Invalid product ID or quantity",
      };
    }

    const product = await Product.findById(productId);
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
      productId: product._id.toString(),
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
    await connectDB();

    if (!searchQuery || searchQuery.length < 2) {
      return {
        success: false,
        error: "Search query must be at least 2 characters",
      };
    }

    const products = await Product.find({
      name: { $regex: searchQuery, $options: "i" },
    }).limit(10);

    const data = products.map((p) => ({
      id: p._id.toString(),
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
    await connectDB();

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
    const saleItems: ISaleItem[] = [];
    let totalAmount = 0;

    for (const item of request.items) {
      const product = await Product.findById(item.productId);

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

      saleItems.push({
        productId: product._id.toString(),
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

    // Create payment history if initial payment was made
    const paymentHistory = initialPayment > 0 ? [{
      date: new Date(),
      amount: initialPayment,
      paymentType: request.paymentType,
    }] : [];

    // Create sale record
    const saleData: any = {
      date: new Date(),
      customerName: request.customerName || "Walk-in",
      paymentType: request.paymentType,
      status,
      totalAmount,
      initialPayment,
      balanceAmount,
      paymentHistory,
      items: saleItems,
    };

    // Only add serialNumber if it exists and is not empty
    if (request.serialNumber && request.serialNumber.trim() !== "") {
      saleData.serialNumber = request.serialNumber.trim();
      console.log("Serial number being saved:", saleData.serialNumber);
    } else {
      console.log("No serial number provided. request.serialNumber:", request.serialNumber);
    }

    const sale = new Sale(saleData);
    console.log("Sale document before save:", JSON.stringify(sale.toObject(), null, 2));

    await sale.save();

    // Update product stock for all items
    for (const item of request.items) {
      await Product.findByIdAndUpdate(
        item.productId,
        {
          $inc: { stock: -item.quantity },
        },
        { new: true }
      );
    }

    return {
      success: true,
      data: {
        _id: sale._id.toString(),
        date: sale.date.toISOString(),
        customerName: sale.customerName,
        paymentType: sale.paymentType,
        status: sale.status,
        totalAmount: sale.totalAmount,
        initialPayment: sale.initialPayment,
        balanceAmount: sale.balanceAmount,
        serialNumber: sale.serialNumber,
        paymentHistory: (sale.paymentHistory || []).map((payment: any) => ({
          date: new Date(payment.date).toISOString(),
          amount: payment.amount,
          paymentType: payment.paymentType,
        })),
        items: saleItems.map(item => ({
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
    await connectDB();

    const query: Record<string, unknown> = {};

    if (filters?.status) {
      query.status = filters.status;
    }

    if (filters?.startDate || filters?.endDate) {
      const dateQuery: Record<string, unknown> = {};
      if (filters.startDate) {
        dateQuery.$gte = filters.startDate;
      }
      if (filters.endDate) {
        dateQuery.$lte = filters.endDate;
      }
      query.date = dateQuery;
    }

    const sales = await Sale.find(query).sort({ date: -1 }).lean();

    const data = sales.map((sale) => ({
      _id: sale._id.toString(),
      date: new Date(sale.date).toISOString(),
      customerName: sale.customerName,
      paymentType: sale.paymentType,
      status: sale.status,
      totalAmount: sale.totalAmount,
      initialPayment: sale.initialPayment || 0,
      balanceAmount: sale.balanceAmount || 0,
      serialNumber: sale.serialNumber,
      paymentHistory: (sale.paymentHistory || []).map((payment: any) => ({
        date: new Date(payment.date).toISOString(),
        amount: payment.amount,
        paymentType: payment.paymentType,
      })),
      items: sale.items.map((item: ISaleItem) => ({
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
    await connectDB();

    const sale = await Sale.findById(id).lean();
    if (!sale) {
      return {
        success: false,
        error: "Sale not found",
      };
    }

    return {
      success: true,
      data: {
        _id: sale._id.toString(),
        date: new Date(sale.date).toISOString(),
        customerName: sale.customerName,
        paymentType: sale.paymentType,
        status: sale.status,
        totalAmount: sale.totalAmount,
        initialPayment: sale.initialPayment || 0,
        balanceAmount: sale.balanceAmount || 0,
        serialNumber: sale.serialNumber,
        paymentHistory: (sale.paymentHistory || []).map((payment: any) => ({
          date: new Date(payment.date).toISOString(),
          amount: payment.amount,
          paymentType: payment.paymentType,
        })),
        items: sale.items.map((item: ISaleItem) => ({
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
    await connectDB();

    const existingSale = await Sale.findById(id).lean();
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

    await Sale.findByIdAndUpdate(id, { status: "PAID" });
    
    const updatedSale = await Sale.findById(id).lean();
    if (!updatedSale) {
      return {
        success: false,
        error: "Failed to fetch updated sale",
      };
    }

    return {
      success: true,
      data: {
        _id: updatedSale._id.toString(),
        date: new Date(updatedSale.date).toISOString(),
        customerName: updatedSale.customerName,
        paymentType: updatedSale.paymentType,
        status: updatedSale.status,
        totalAmount: updatedSale.totalAmount,
        initialPayment: updatedSale.initialPayment || 0,
        balanceAmount: updatedSale.balanceAmount || 0,
        paymentHistory: (updatedSale.paymentHistory || []).map((payment: any) => ({
          date: new Date(payment.date).toISOString(),
          amount: payment.amount,
          paymentType: payment.paymentType,
        })),
        items: updatedSale.items.map((item: ISaleItem) => ({
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
    await connectDB();

    const sales = await Sale.find({ status: "PENDING" }).sort({ date: -1 }).lean();

    const data = sales.map((sale) => ({
      _id: sale._id.toString(),
      date: new Date(sale.date).toISOString(),
      customerName: sale.customerName,
      paymentType: sale.paymentType,
      status: sale.status,
      totalAmount: sale.totalAmount,
      initialPayment: sale.initialPayment || 0,
      balanceAmount: sale.balanceAmount || 0,
      paymentHistory: (sale.paymentHistory || []).map((payment: any) => ({
        date: new Date(payment.date).toISOString(),
        amount: payment.amount,
        paymentType: payment.paymentType,
      })),
      items: sale.items.map((item: ISaleItem) => ({
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
    await connectDB();

    const sale = await Sale.findById(id);
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

    // Add payment to history as a sub-payment
    const newPayment = {
      date: new Date(),
      amount: paymentAmount,
      paymentType: paymentType || sale.paymentType,
    };

    if (!sale.paymentHistory) {
      sale.paymentHistory = [];
    }
    sale.paymentHistory.push(newPayment);

    // Update payment totals
    sale.initialPayment += paymentAmount;
    sale.balanceAmount -= paymentAmount;

    // If fully paid, update status
    if (sale.balanceAmount <= 0) {
      sale.status = "PAID";
      sale.balanceAmount = 0;
    }

    await sale.save();

    const updatedSale = await Sale.findById(id).lean();
    if (!updatedSale) {
      return {
        success: false,
        error: "Failed to fetch updated sale",
      };
    }

    return {
      success: true,
      data: {
        _id: updatedSale._id.toString(),
        date: new Date(updatedSale.date).toISOString(),
        customerName: updatedSale.customerName,
        paymentType: updatedSale.paymentType,
        status: updatedSale.status,
        totalAmount: updatedSale.totalAmount,
        initialPayment: updatedSale.initialPayment || 0,
        balanceAmount: updatedSale.balanceAmount || 0,
        paymentHistory: (updatedSale.paymentHistory || []).map((payment: any) => ({
          date: new Date(payment.date).toISOString(),
          amount: payment.amount,
          paymentType: payment.paymentType,
        })),
        items: updatedSale.items.map((item: ISaleItem) => ({
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
    await connectDB();

    const allSales = await Sale.find({});

    const stats = {
      totalSales: allSales.length,
      totalRevenue: 0,
      paidSales: 0,
      pendingSales: 0,
      pendingAmount: 0,
    };

    for (const sale of allSales) {
      stats.totalRevenue += sale.totalAmount;

      if (sale.status === "PAID") {
        stats.paidSales += 1;
      } else {
        stats.pendingSales += 1;
        stats.pendingAmount += sale.totalAmount;
      }
    }

    return {
      success: true,
      data: stats,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch statistics";
    return {
      success: false,
      error: errorMessage,
    };
  }
}
