"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { Expenditure } from "@prisma/client";

// Types for responses
export type ActionResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

export type ExpenditureData = {
  id: string;
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

// Helper to serialize Prisma document
function serializeExpenditure(expenditure: Expenditure): ExpenditureData {
  return {
    id: expenditure.id,
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

    // Get current date and compute year & month
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1; // JavaScript months are 0-indexed

    // Create new expenditure
    const expenditure = await prisma.expenditure.create({
      data: {
        category: input.category.trim(),
        amount: input.amount,
        notes: input.notes?.trim() || "",
        date: currentDate,
        year: year,
        month: month,
      },
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

    // Fetch expenditures for the given month and year
    const expenditures = await prisma.expenditure.findMany({
      where: {
        year: year,
        month: month,
      },
      orderBy: { date: 'desc' },
    });

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
    const expenditures = await prisma.expenditure.findMany({
      orderBy: { date: 'desc' },
    });

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
    const expenditure = await prisma.expenditure.findUnique({
      where: { id },
    });

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
    await prisma.expenditure.delete({
      where: { id },
    });

    revalidatePath("/expenditures");

    return {
      success: true,
      data: { id },
    };
  } catch (error) {
    console.error("Error deleting expenditure:", error);
    
    if ((error as { code?: string }).code === 'P2025') {
      return {
        success: false,
        error: "Expenditure not found",
      };
    }
    
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

    const updateData: Partial<{
      category: string;
      amount: number;
      notes: string;
    }> = {};
    if (input.category !== undefined)
      updateData.category = input.category.trim();
    if (input.amount !== undefined) updateData.amount = input.amount;
    if (input.notes !== undefined) updateData.notes = input.notes.trim();

    const expenditure = await prisma.expenditure.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/expenditures");

    return {
      success: true,
      data: serializeExpenditure(expenditure),
    };
  } catch (error) {
    console.error("Error updating expenditure:", error);
    
    if ((error as { code?: string }).code === 'P2025') {
      return {
        success: false,
        error: "Expenditure not found",
      };
    }
    
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
    const result = await prisma.expenditure.aggregate({
      where: {
        year: year,
        month: month,
      },
      _sum: {
        amount: true,
      },
    });

    const totalAmount = result._sum.amount || 0;

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
    const result = await prisma.expenditure.groupBy({
      by: ['category'],
      where: {
        year: year,
        month: month,
      },
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    });

    const formattedResult = result.map((item) => ({
      category: item.category,
      totalAmount: item._sum.amount || 0,
      count: item._count.id,
    }));

    return {
      success: true,
      data: formattedResult,
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
    const result = await prisma.expenditure.findMany({
      distinct: ['year'],
      select: { year: true },
      orderBy: { year: 'desc' },
    });

    const years = result.map(item => item.year);

    return {
      success: true,
      data: years,
    };
  } catch (error) {
    console.error("Error fetching available years:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch available years",
    };
  }
}
