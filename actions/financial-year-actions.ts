"use server";

import prisma from "@/lib/prisma";

export type ActionResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

export type FinancialYearSummary = {
  financialYear: string; // e.g., "2024-25"
  totalAmount: number;
  monthlyBreakdown: {
    month: number;
    year: number;
    monthName: string;
    amount: number;
  }[];
};

// Get financial year string (e.g., "2024-25" for FY starting April 2024)
function getFinancialYearString(year: number): string {
  return `${year}-${(year + 1).toString().slice(-2)}`;
}

// Get start and end dates for a financial year
function getFinancialYearRange(financialYear: number): {
  startMonth: number;
  startYear: number;
  endMonth: number;
  endYear: number;
} {
  return {
    startMonth: 4, // April
    startYear: financialYear,
    endMonth: 3, // March
    endYear: financialYear + 1,
  };
}

// Get current financial year
export async function getCurrentFinancialYear(): Promise<ActionResponse<number>> {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  
  // If current month is Jan-March, we're in previous calendar year's FY
  const fy = currentMonth < 4 ? currentYear - 1 : currentYear;
  
  return {
    success: true,
    data: fy,
  };
}

// GET FINANCIAL YEAR SUMMARY
export async function getFinancialYearSummary(
  financialYear: number
): Promise<ActionResponse<FinancialYearSummary>> {
  try {
    const range = getFinancialYearRange(financialYear);
    const monthNames = [
      'April', 'May', 'June', 'July', 'August', 'September',
      'October', 'November', 'December', 'January', 'February', 'March'
    ];

    // Fetch all expenditures for the financial year
    const expenditures = await prisma.expenditure.findMany({
      where: {
        OR: [
          // April to December of start year
          {
            year: range.startYear,
            month: { gte: range.startMonth, lte: 12 },
          },
          // January to March of end year
          {
            year: range.endYear,
            month: { gte: 1, lte: range.endMonth },
          },
        ],
      },
      orderBy: [
        { year: 'asc' },
        { month: 'asc' },
      ],
    });

    // Calculate monthly breakdown
    const monthlyMap = new Map<string, number>();
    
    // Initialize all 12 months
    for (let i = 0; i < 12; i++) {
      const monthIndex = (range.startMonth + i - 1) % 12;
      const year = range.startMonth + i <= 12 ? range.startYear : range.endYear;
      const month = monthIndex + 1;
      const key = `${year}-${month}`;
      monthlyMap.set(key, 0);
    }

    // Sum expenditures by month
    let totalAmount = 0;
    expenditures.forEach((exp) => {
      const key = `${exp.year}-${exp.month}`;
      monthlyMap.set(key, (monthlyMap.get(key) || 0) + exp.amount);
      totalAmount += exp.amount;
    });

    // Build monthly breakdown array
    const monthlyBreakdown = [];
    for (let i = 0; i < 12; i++) {
      const monthIndex = (range.startMonth + i - 1) % 12;
      const year = range.startMonth + i <= 12 ? range.startYear : range.endYear;
      const month = monthIndex + 1;
      const key = `${year}-${month}`;

      monthlyBreakdown.push({
        month,
        year,
        monthName: monthNames[i],
        amount: monthlyMap.get(key) || 0,
      });
    }

    return {
      success: true,
      data: {
        financialYear: getFinancialYearString(financialYear),
        totalAmount,
        monthlyBreakdown,
      },
    };
  } catch (error) {
    console.error("Error fetching financial year summary:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch financial year summary",
    };
  }
}

// GET AVAILABLE FINANCIAL YEARS
export async function getAvailableFinancialYears(): Promise<ActionResponse<number[]>> {
  try {
    const years = await prisma.expenditure.findMany({
      distinct: ['year'],
      select: { year: true },
    });

    const financialYears = new Set<number>();

    years.forEach(({ year }) => {
      // Each calendar year could be part of two financial years
      financialYears.add(year); // FY starting this year
      if (year > 2000) {
        financialYears.add(year - 1); // FY starting previous year (for Jan-Mar data)
      }
    });

    const sortedFYs = Array.from(financialYears).sort((a, b) => b - a);

    return {
      success: true,
      data: sortedFYs,
    };
  } catch (error) {
    console.error("Error fetching available financial years:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch available financial years",
    };
  }
}
