"use server";

import connectDB from "@/lib/mongodb";
import Expenditure, { IExpenditure } from "@/models/Expenditure";
import { revalidatePath } from "next/cache";

// Types for responses
export type ActionResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

export type ExpenditureData = {
  _id: string;
  category: string;
  amount: number;
  notes?: string;
  date: string;
  year: number;
  month: number;
  createdAt: string;
  updatedAt: string;
};

export type ExpenditureFilterResponse = {
  expenditures: ExpenditureData[];
  totalAmount: number;
};

export type CreateExpenditureInput = {
  category: string;
  amount: number;
  notes?: string;
};

// Helper to serialize MongoDB document
function serializeExpenditure(expenditure: IExpenditure): ExpenditureData {
  return {
    _id: expenditure._id.toString(),
    category: expenditure.category,
    amount: expenditure.amount,
    notes: expenditure.notes || "",
    date: expenditure.date.toISOString(),
    year: expenditure.year,
    month: expenditure.month,
    createdAt: expenditure.createdAt.toISOString(),
    updatedAt: expenditure.updatedAt.toISOString(),
  };
}

// Validation function
function validateExpenditureInput(
  input: CreateExpenditureInput
): { valid: boolean; error?: string } {
  // Validate category
  if (!input.category || input.category.trim() === "") {
    return { valid: false, error: "Category is required and cannot be empty" };
  }

  // Validate amount
  if (typeof input.amount !== "number") {
    return { valid: false, error: "Amount must be a number" };
  }

  if (input.amount < 1) {
    return { valid: false, error: "Amount must be at least 1" };
  }

  return { valid: true };
}

// CREATE NEW EXPENDITURE
export async function createExpenditure(
  input: CreateExpenditureInput
): Promise<ActionResponse<ExpenditureData>> {
  try {
    // Validate input
    const validation = validateExpenditureInput(input);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
      };
    }

    await connectDB();

    // Get current date and compute year & month
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1; // JavaScript months are 0-indexed

    // Create new expenditure
    const expenditure = await Expenditure.create({
      category: input.category.trim(),
      amount: input.amount,
      notes: input.notes?.trim() || "",
      date: currentDate,
      year: year,
      month: month,
    });

    revalidatePath("/expenditures");

    return {
      success: true,
      data: serializeExpenditure(expenditure),
    };
  } catch (error) {
    console.error("Error creating expenditure:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create expenditure",
    };
  }
}

// GET EXPENDITURES BY MONTH & YEAR WITH TOTAL
export async function getExpendituresByMonth(
  year: number,
  month: number
): Promise<ActionResponse<ExpenditureFilterResponse>> {
  try {
    // Validate year and month
    if (!year || year < 2000 || year > 2100) {
      return {
        success: false,
        error: "Invalid year",
      };
    }

    if (!month || month < 1 || month > 12) {
      return {
        success: false,
        error: "Invalid month (must be between 1 and 12)",
      };
    }

    await connectDB();

    // Fetch expenditures for the given month and year
    const expenditures = await Expenditure.find({
      year: year,
      month: month,
    }).sort({ date: -1 });

    // Calculate total amount
    const totalAmount = expenditures.reduce(
      (sum, exp) => sum + exp.amount,
      0
    );

    return {
      success: true,
      data: {
        expenditures: expenditures.map(serializeExpenditure),
        totalAmount: totalAmount,
      },
    };
  } catch (error) {
    console.error("Error fetching expenditures:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch expenditures",
    };
  }
}

// GET ALL EXPENDITURES (NO FILTER)
export async function getAllExpenditures(): Promise<
  ActionResponse<ExpenditureData[]>
> {
  try {
    await connectDB();
    const expenditures = await Expenditure.find({}).sort({ date: -1 });

    return {
      success: true,
      data: expenditures.map(serializeExpenditure),
    };
  } catch (error) {
    console.error("Error fetching all expenditures:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch expenditures",
    };
  }
}

// GET SINGLE EXPENDITURE BY ID
export async function getExpenditureById(
  id: string
): Promise<ActionResponse<ExpenditureData>> {
  try {
    await connectDB();
    const expenditure = await Expenditure.findById(id);

    if (!expenditure) {
      return {
        success: false,
        error: "Expenditure not found",
      };
    }

    return {
      success: true,
      data: serializeExpenditure(expenditure),
    };
  } catch (error) {
    console.error("Error fetching expenditure:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch expenditure",
    };
  }
}

// DELETE EXPENDITURE
export async function deleteExpenditure(
  id: string
): Promise<ActionResponse<{ id: string }>> {
  try {
    await connectDB();

    const expenditure = await Expenditure.findByIdAndDelete(id);

    if (!expenditure) {
      return {
        success: false,
        error: "Expenditure not found",
      };
    }

    revalidatePath("/expenditures");

    return {
      success: true,
      data: { id },
    };
  } catch (error) {
    console.error("Error deleting expenditure:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete expenditure",
    };
  }
}

// UPDATE EXPENDITURE
export async function updateExpenditure(
  id: string,
  input: Partial<CreateExpenditureInput>
): Promise<ActionResponse<ExpenditureData>> {
  try {
    // Validate input if provided
    if (input.category !== undefined || input.amount !== undefined) {
      const validationInput = {
        category: input.category || "",
        amount: input.amount || 0,
        notes: input.notes,
      };

      const validation = validateExpenditureInput(validationInput);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error,
        };
      }
    }

    await connectDB();

    const updateData: Partial<{
      category: string;
      amount: number;
      notes: string;
    }> = {};
    if (input.category !== undefined)
      updateData.category = input.category.trim();
    if (input.amount !== undefined) updateData.amount = input.amount;
    if (input.notes !== undefined) updateData.notes = input.notes.trim();

    const expenditure = await Expenditure.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!expenditure) {
      return {
        success: false,
        error: "Expenditure not found",
      };
    }

    revalidatePath("/expenditures");

    return {
      success: true,
      data: serializeExpenditure(expenditure),
    };
  } catch (error) {
    console.error("Error updating expenditure:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update expenditure",
    };
  }
}

// GET TOTAL EXPENDITURE FOR A SPECIFIC MONTH
export async function getMonthlyTotal(
  year: number,
  month: number
): Promise<ActionResponse<{ totalAmount: number }>> {
  try {
    await connectDB();

    const expenditures = await Expenditure.find({
      year: year,
      month: month,
    });

    const totalAmount = expenditures.reduce(
      (sum, exp) => sum + exp.amount,
      0
    );

    return {
      success: true,
      data: { totalAmount },
    };
  } catch (error) {
    console.error("Error calculating monthly total:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to calculate monthly total",
    };
  }
}

// GET EXPENDITURES SUMMARY BY CATEGORY FOR A MONTH
export async function getExpendituresByCategoryForMonth(
  year: number,
  month: number
): Promise<
  ActionResponse<{ category: string; totalAmount: number; count: number }[]>
> {
  try {
    await connectDB();

    const expenditures = await Expenditure.find({
      year: year,
      month: month,
    });

    // Group by category
    const categoryMap = new Map<
      string,
      { totalAmount: number; count: number }
    >();

    expenditures.forEach((exp) => {
      const existing = categoryMap.get(exp.category) || {
        totalAmount: 0,
        count: 0,
      };
      categoryMap.set(exp.category, {
        totalAmount: existing.totalAmount + exp.amount,
        count: existing.count + 1,
      });
    });

    const result = Array.from(categoryMap.entries()).map(
      ([category, data]) => ({
        category,
        totalAmount: data.totalAmount,
        count: data.count,
      })
    );

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error("Error fetching category summary:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch category summary",
    };
  }
}

// GET AVAILABLE YEARS (for filter dropdown)
export async function getAvailableYears(): Promise<ActionResponse<number[]>> {
  try {
    await connectDB();

    const years = await Expenditure.distinct("year");
    const sortedYears = years.sort((a, b) => b - a);

    return {
      success: true,
      data: sortedYears,
    };
  } catch (error) {
    console.error("Error fetching available years:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch available years",
    };
  }
}
