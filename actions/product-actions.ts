"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Product } from "@prisma/client";

// Types for responses
export type ActionResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

export type ProductData = {
  id: string;
  name: string;
  category: string;
  purchasePrice: number;
  sellingPrice: number;
  stock: number;
  supplierName: string;
  createdAt: string;
  updatedAt: string;
};

// Helper to serialize Prisma document
function serializeProduct(product: Product): ProductData {
  return {
    id: product.id,
    name: product.name,
    category: product.category,
    purchasePrice: product.purchasePrice,
    sellingPrice: product.sellingPrice,
    stock: product.stock,
    supplierName: product.supplierName,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}

// GET ALL PRODUCTS
export async function getProducts(): Promise<ActionResponse<ProductData[]>> {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return {
      success: true,
      data: products.map(serializeProduct),
    };
  } catch (error) {
    console.error("Error fetching products:", error);
    return { success: false, error: "Failed to fetch products" };
  }
}

// GET SINGLE PRODUCT BY ID
export async function getProductById(id: string): Promise<ActionResponse<ProductData>> {
  try {
    const product = await prisma.product.findUnique({
      where: { id },
    });
    
    if (!product) {
      return { success: false, error: "Product not found" };
    }
    
    return { success: true, data: serializeProduct(product) };
  } catch (error) {
    console.error("Error fetching product:", error);
    return { success: false, error: "Failed to fetch product" };
  }
}

// CREATE PRODUCT
export async function createProduct(formData: {
  name: string;
  category?: string;
  purchasePrice?: number;
  sellingPrice?: number;
  stock?: number;
  supplierName?: string;
}): Promise<ActionResponse<ProductData>> {
  try {
    const { name, category, purchasePrice, sellingPrice, stock, supplierName } = formData;

    // Validation: name is required
    if (!name || name.trim() === "") {
      return { success: false, error: "Product name is required" };
    }

    // Check for duplicate name (case-insensitive)
    const existingProduct = await prisma.product.findFirst({
      where: {
        name: {
          equals: name.trim(),
          mode: 'insensitive',
        },
      },
    });
    
    if (existingProduct) {
      return { success: false, error: "A product with this name already exists" };
    }

    // Validate prices and stock
    const parsedPurchasePrice = Number(purchasePrice) || 0;
    const parsedSellingPrice = Number(sellingPrice) || 0;
    const parsedStock = Number(stock) || 0;

    if (parsedPurchasePrice < 0) {
      return { success: false, error: "Purchase price cannot be negative" };
    }

    if (parsedSellingPrice < 0) {
      return { success: false, error: "Selling price cannot be negative" };
    }

    if (parsedStock < 0) {
      return { success: false, error: "Stock cannot be negative" };
    }

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        category: category?.trim() || "",
        purchasePrice: parsedPurchasePrice,
        sellingPrice: parsedSellingPrice,
        stock: parsedStock,
        supplierName: supplierName?.trim() || "",
      },
    });

    revalidatePath("/stock");
    revalidatePath("/products");
    
    return { success: true, data: serializeProduct(product) };
  } catch (error) {
    console.error("Error creating product:", error);
    
    // Prisma unique constraint error
    if ((error as { code?: string }).code === 'P2002') {
      return { success: false, error: "A product with this name already exists" };
    }
    
    return { success: false, error: "Failed to create product" };
  }
}

// UPDATE PRODUCT
export async function updateProduct(
  id: string,
  formData: {
    name?: string;
    category?: string;
    purchasePrice?: number;
    sellingPrice?: number;
    stock?: number;
    supplierName?: string;
  }
): Promise<ActionResponse<ProductData>> {
  try {
    const { name, category, purchasePrice, sellingPrice, stock, supplierName } = formData;

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });
    
    if (!existingProduct) {
      return { success: false, error: "Product not found" };
    }

    // If name is being changed, check for duplicates (case-insensitive)
    if (name && name.trim() !== existingProduct.name) {
      const duplicateProduct = await prisma.product.findFirst({
        where: {
          id: { not: id },
          name: {
            equals: name.trim(),
            mode: 'insensitive',
          },
        },
      });
      
      if (duplicateProduct) {
        return { success: false, error: "A product with this name already exists" };
      }
    }

    // Validate values
    const updateData: {
      name?: string;
      category?: string;
      purchasePrice?: number;
      sellingPrice?: number;
      stock?: number;
      supplierName?: string;
    } = {};
    
    if (name !== undefined) {
      if (name.trim() === "") {
        return { success: false, error: "Product name cannot be empty" };
      }
      updateData.name = name.trim();
    }
    
    if (category !== undefined) {
      updateData.category = category.trim();
    }
    
    if (purchasePrice !== undefined) {
      const parsed = Number(purchasePrice);
      if (parsed < 0) {
        return { success: false, error: "Purchase price cannot be negative" };
      }
      updateData.purchasePrice = parsed;
    }
    
    if (sellingPrice !== undefined) {
      const parsed = Number(sellingPrice);
      if (parsed < 0) {
        return { success: false, error: "Selling price cannot be negative" };
      }
      updateData.sellingPrice = parsed;
    }
    
    if (stock !== undefined) {
      const parsed = Number(stock);
      if (parsed < 0) {
        return { success: false, error: "Stock cannot be negative" };
      }
      updateData.stock = parsed;
    }

    if (supplierName !== undefined) {
      updateData.supplierName = supplierName.trim();
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/stock");
    revalidatePath("/products");
    
    return { success: true, data: serializeProduct(updatedProduct) };
  } catch (error) {
    console.error("Error updating product:", error);
    
    // Prisma unique constraint error
    if ((error as { code?: string }).code === 'P2002') {
      return { success: false, error: "A product with this name already exists" };
    }
    
    return { success: false, error: "Failed to update product" };
  }
}

// DELETE PRODUCT
export async function deleteProduct(id: string): Promise<ActionResponse> {
  try {
    // Check if product has purchase history
    const purchaseCount = await prisma.purchase.count({
      where: { productId: id },
    });
    
    if (purchaseCount > 0) {
      return { 
        success: false, 
        error: "Cannot delete product with purchase history. Consider archiving instead." 
      };
    }

    await prisma.product.delete({
      where: { id },
    });

    revalidatePath("/stock");
    revalidatePath("/products");
    
    return { success: true };
  } catch (error) {
    console.error("Error deleting product:", error);
    
    // Prisma record not found error
    if ((error as { code?: string }).code === 'P2025') {
      return { success: false, error: "Product not found" };
    }
    
    return { success: false, error: "Failed to delete product" };
  }
}

// GET TOTAL STOCK OF A PRODUCT
export async function getProductStock(id: string): Promise<ActionResponse<number>> {
  try {
    const product = await prisma.product.findUnique({
      where: { id },
      select: { stock: true },
    });
    
    if (!product) {
      return { success: false, error: "Product not found" };
    }
    
    return { success: true, data: product.stock };
  } catch (error) {
    console.error("Error fetching product stock:", error);
    return { success: false, error: "Failed to fetch product stock" };
  }
}
