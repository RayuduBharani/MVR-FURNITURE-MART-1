"use server";

import connectDB from "@/lib/mongodb";
import Product, { IProduct } from "@/models/Product";
import Purchase from "@/models/Purchase";
import { revalidatePath } from "next/cache";
import mongoose from "mongoose";

// Types for responses
export type ActionResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

export type ProductData = {
  _id: string;
  name: string;
  category: string;
  purchasePrice: number;
  sellingPrice: number;
  stock: number;
  supplierName: string;
  createdAt: string;
  updatedAt: string;
};

// Helper to serialize MongoDB document
function serializeProduct(product: IProduct): ProductData {
  return {
    _id: product._id.toString(),
    name: product.name,
    category: product.category,
    purchasePrice: product.purchasePrice,
    sellingPrice: product.sellingPrice,
    stock: product.stock,
    supplierName: product.supplierName || "",
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}

// GET ALL PRODUCTS
export async function getProducts(): Promise<ActionResponse<ProductData[]>> {
  try {
    await connectDB();
    const products = await Product.find({}).sort({ createdAt: -1 });
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
    await connectDB();
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return { success: false, error: "Invalid product ID" };
    }
    
    const product = await Product.findById(id);
    
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
    await connectDB();
    
    const { name, category, purchasePrice, sellingPrice, stock, supplierName } = formData;

    // Validation: name is required
    if (!name || name.trim() === "") {
      return { success: false, error: "Product name is required" };
    }

    // Check for duplicate name
    const existingProduct = await Product.findOne({ 
      name: { $regex: new RegExp(`^${name.trim()}$`, "i") } 
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

    const product = await Product.create({
      name: name.trim(),
      category: category?.trim() || "",
      purchasePrice: parsedPurchasePrice,
      sellingPrice: parsedSellingPrice,
      stock: parsedStock,
      supplierName: supplierName?.trim() || "",
    });

    revalidatePath("/stock");
    revalidatePath("/products");
    
    return { success: true, data: serializeProduct(product) };
  } catch (error) {
    console.error("Error creating product:", error);
    
    if ((error as { code?: number }).code === 11000) {
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
    await connectDB();
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return { success: false, error: "Invalid product ID" };
    }

    const { name, category, purchasePrice, sellingPrice, stock, supplierName } = formData;

    // Check if product exists
    const existingProduct = await Product.findById(id);
    if (!existingProduct) {
      return { success: false, error: "Product not found" };
    }

    // If name is being changed, check for duplicates
    if (name && name.trim() !== existingProduct.name) {
      const duplicateProduct = await Product.findOne({
        _id: { $ne: id },
        name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
      });
      
      if (duplicateProduct) {
        return { success: false, error: "A product with this name already exists" };
      }
    }

    // Validate values
    const updateData: Partial<IProduct> = {};
    
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

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!updatedProduct) {
      return { success: false, error: "Failed to update product" };
    }

    revalidatePath("/stock");
    revalidatePath("/products");
    
    return { success: true, data: serializeProduct(updatedProduct) };
  } catch (error) {
    console.error("Error updating product:", error);
    
    if ((error as { code?: number }).code === 11000) {
      return { success: false, error: "A product with this name already exists" };
    }
    
    return { success: false, error: "Failed to update product" };
  }
}

// DELETE PRODUCT
export async function deleteProduct(id: string): Promise<ActionResponse> {
  try {
    await connectDB();
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return { success: false, error: "Invalid product ID" };
    }

    // Check if product has purchase history
    const purchaseCount = await Purchase.countDocuments({ productId: id });
    if (purchaseCount > 0) {
      return { 
        success: false, 
        error: "Cannot delete product with purchase history. Consider archiving instead." 
      };
    }

    const deletedProduct = await Product.findByIdAndDelete(id);
    
    if (!deletedProduct) {
      return { success: false, error: "Product not found" };
    }

    revalidatePath("/stock");
    revalidatePath("/products");
    
    return { success: true };
  } catch (error) {
    console.error("Error deleting product:", error);
    return { success: false, error: "Failed to delete product" };
  }
}

// GET TOTAL STOCK OF A PRODUCT
export async function getProductStock(id: string): Promise<ActionResponse<number>> {
  try {
    await connectDB();
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return { success: false, error: "Invalid product ID" };
    }
    
    const product = await Product.findById(id).select("stock");
    
    if (!product) {
      return { success: false, error: "Product not found" };
    }
    
    return { success: true, data: product.stock };
  } catch (error) {
    console.error("Error fetching product stock:", error);
    return { success: false, error: "Failed to fetch product stock" };
  }
}
