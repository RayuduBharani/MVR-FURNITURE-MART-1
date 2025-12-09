"use server";

import prisma from "@/lib/prisma";

export type ActionResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

export type DailyReport = {
  date: string;
  totalSales: number;
  totalExpenditures: number;
  totalPurchases: number;
  remainingSupplierAmount: number;
  remainingCustomerAmount: number;
  profit: number;
  salesCount: number;
  expendituresCount: number;
  purchasesCount: number;
  paidBillsToday: Array<{
    id: string;
    customerName: string;
    totalAmount: number;
    paidAmount: number;
    paymentType: string;
    date: string;
  }>;
};

export type MonthlyReport = {
  month: number;
  year: number;
  monthName: string;
  totalSales: number;
  totalExpenditures: number;
  totalPurchases: number;
  remainingSupplierAmount: number;
  remainingCustomerAmount: number;
  profit: number;
  salesCount: number;
  expendituresCount: number;
  purchasesCount: number;
  dailyBreakdown: DailyReport[];
};

export type YearlyReport = {
  year: number;
  totalSales: number;
  totalExpenditures: number;
  totalPurchases: number;
  remainingSupplierAmount: number;
  remainingCustomerAmount: number;
  profit: number;
  salesCount: number;
  expendituresCount: number;
  purchasesCount: number;
  monthlyBreakdown: MonthlyReport[];
};

export type FinancialYearReport = {
  financialYear: string;
  totalSales: number;
  totalExpenditures: number;
  totalPurchases: number;
  remainingSupplierAmount: number;
  remainingCustomerAmount: number;
  profit: number;
  salesCount: number;
  expendituresCount: number;
  purchasesCount: number;
  monthlyBreakdown: {
    month: number;
    year: number;
    monthName: string;
    totalSales: number;
    totalExpenditures: number;
    totalPurchases: number;
    remainingSupplierAmount: number;
    remainingCustomerAmount: number;
    profit: number;
  }[];
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

// GET DAILY REPORT
export async function getDailyReport(
  date: Date
): Promise<ActionResponse<DailyReport>> {
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    // Fetch sales for the day
    const sales = await prisma.sale.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    // Fetch sales with payments made today
    const paidBillsToday = await prisma.sale.findMany({
      where: {
        paymentHistory: {
          some: {
            date: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
        },
      },
      include: {
        paymentHistory: {
          where: {
            date: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
        },
      },
    });

    const paidBillsList = paidBillsToday.map(sale => {
      const paidAmountToday = sale.paymentHistory.reduce((sum, p) => sum + p.amount, 0);
      
      return {
        id: sale.id,
        customerName: sale.customerName,
        totalAmount: sale.totalAmount,
        paidAmount: paidAmountToday,
        paymentType: sale.paymentHistory[0]?.paymentType || sale.paymentType,
        date: sale.date.toISOString(),
      };
    });

    // Fetch expenditures for the day
    const expenditures = await prisma.expenditure.findMany({
      where: {
        year: year,
        month: month,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    // Fetch purchases for the day
    const purchases = await prisma.purchase.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    const totalSales = sales.reduce((sum, sale) => sum + (sale.totalAmount - sale.balanceAmount), 0);
    const totalExpenditures = expenditures.reduce((sum, exp) => sum + exp.amount, 0);
    const totalPurchases = purchases.reduce((sum, purchase) => sum + purchase.paidAmount, 0);
    const remainingSupplierAmount = purchases.reduce((sum, purchase) => sum + (purchase.total - purchase.paidAmount), 0);
    const remainingCustomerAmount = sales.reduce((sum, sale) => sum + sale.balanceAmount, 0);

    return {
      success: true,
      data: {
        date: date.toISOString(),
        totalSales,
        totalExpenditures,
        totalPurchases,
        remainingSupplierAmount,
        remainingCustomerAmount,
        profit: totalSales - totalExpenditures - totalPurchases,
        salesCount: sales.length,
        expendituresCount: expenditures.length,
        purchasesCount: purchases.length,
        paidBillsToday: paidBillsList,
      },
    };
  } catch (error) {
    console.error("Error fetching daily report:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch daily report",
    };
  }
}

// GET MONTHLY REPORT
export async function getMonthlyReport(
  year: number,
  month: number
): Promise<ActionResponse<MonthlyReport>> {
  try {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    // Fetch sales for the month
    const sales = await prisma.sale.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Fetch expenditures for the month
    const expenditures = await prisma.expenditure.findMany({
      where: {
        year: year,
        month: month,
      },
    });

    // Fetch purchases for the month
    const purchases = await prisma.purchase.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const totalSales = sales.reduce((sum, sale) => sum + (sale.totalAmount - sale.balanceAmount), 0);
    const totalExpenditures = expenditures.reduce((sum, exp) => sum + exp.amount, 0);
    const totalPurchases = purchases.reduce((sum, purchase) => sum + purchase.paidAmount, 0);
    const remainingSupplierAmount = purchases.reduce((sum, purchase) => sum + (purchase.total - purchase.paidAmount), 0);
    const remainingCustomerAmount = sales.reduce((sum, sale) => sum + sale.balanceAmount, 0);

    // Daily breakdown
    const daysInMonth = new Date(year, month, 0).getDate();
    const dailyBreakdown: DailyReport[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dayStart = new Date(year, month - 1, day, 0, 0, 0);
      const dayEnd = new Date(year, month - 1, day, 23, 59, 59, 999);

      const daySales = sales.filter(
        (s) => s.date >= dayStart && s.date <= dayEnd
      );
      const dayExpenditures = expenditures.filter((e) => {
        const expDate = new Date(e.date);
        return expDate.getDate() === day;
      });
      const dayPurchases = purchases.filter(
        (p) => p.date >= dayStart && p.date <= dayEnd
      );

      const daySalesTotal = daySales.reduce((sum, sale) => sum + (sale.totalAmount - sale.balanceAmount), 0);
      const dayExpTotal = dayExpenditures.reduce((sum, exp) => sum + exp.amount, 0);
      const dayPurchasesTotal = dayPurchases.reduce((sum, purchase) => sum + purchase.paidAmount, 0);
      const dayRemainingSupplier = dayPurchases.reduce((sum, purchase) => sum + (purchase.total - purchase.paidAmount), 0);
      const dayRemainingCustomer = daySales.reduce((sum, sale) => sum + sale.balanceAmount, 0);

      if (daySalesTotal > 0 || dayExpTotal > 0 || dayPurchasesTotal > 0) {
        dailyBreakdown.push({
          date: dayStart.toISOString(),
          totalSales: daySalesTotal,
          totalExpenditures: dayExpTotal,
          totalPurchases: dayPurchasesTotal,
          remainingSupplierAmount: dayRemainingSupplier,
          remainingCustomerAmount: dayRemainingCustomer,
          profit: daySalesTotal - dayExpTotal - dayPurchasesTotal,
          salesCount: daySales.length,
          expendituresCount: dayExpenditures.length,
          purchasesCount: dayPurchases.length,
          paidBillsToday: [],
        });
      }
    }

    return {
      success: true,
      data: {
        month,
        year,
        monthName: MONTH_NAMES[month - 1],
        totalSales,
        totalExpenditures,
        totalPurchases,
        remainingSupplierAmount,
        remainingCustomerAmount,
        profit: totalSales - totalExpenditures - totalPurchases,
        salesCount: sales.length,
        expendituresCount: expenditures.length,
        purchasesCount: purchases.length,
        dailyBreakdown,
      },
    };
  } catch (error) {
    console.error("Error fetching monthly report:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch monthly report",
    };
  }
}

// GET YEARLY REPORT
export async function getYearlyReport(
  year: number
): Promise<ActionResponse<YearlyReport>> {
  try {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59, 999);

    // Fetch all sales for the year
    const sales = await prisma.sale.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Fetch all expenditures for the year
    const expenditures = await prisma.expenditure.findMany({
      where: {
        year: year,
      },
    });

    // Fetch all purchases for the year
    const purchases = await prisma.purchase.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const totalSales = sales.reduce((sum, sale) => sum + (sale.totalAmount - sale.balanceAmount), 0);
    const totalExpenditures = expenditures.reduce((sum, exp) => sum + exp.amount, 0);
    const totalPurchases = purchases.reduce((sum, purchase) => sum + purchase.paidAmount, 0);
    const remainingSupplierAmount = purchases.reduce((sum, purchase) => sum + (purchase.total - purchase.paidAmount), 0);
    const remainingCustomerAmount = sales.reduce((sum, sale) => sum + sale.balanceAmount, 0);

    // Monthly breakdown
    const monthlyBreakdown: MonthlyReport[] = [];

    for (let month = 1; month <= 12; month++) {
      const monthStart = new Date(year, month - 1, 1);
      const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);

      const monthSales = sales.filter(
        (s) => s.date >= monthStart && s.date <= monthEnd
      );
      const monthExpenditures = expenditures.filter((e) => e.month === month);
      const monthPurchases = purchases.filter(
        (p) => p.date >= monthStart && p.date <= monthEnd
      );

      const monthSalesTotal = monthSales.reduce((sum, sale) => sum + (sale.totalAmount - sale.balanceAmount), 0);
      const monthExpTotal = monthExpenditures.reduce((sum, exp) => sum + exp.amount, 0);
      const monthPurchasesTotal = monthPurchases.reduce((sum, purchase) => sum + purchase.paidAmount, 0);
      const monthRemainingSupplier = monthPurchases.reduce((sum, purchase) => sum + (purchase.total - purchase.paidAmount), 0);
      const monthRemainingCustomer = monthSales.reduce((sum, sale) => sum + sale.balanceAmount, 0);

      if (monthSalesTotal > 0 || monthExpTotal > 0 || monthPurchasesTotal > 0) {
        monthlyBreakdown.push({
          month,
          year,
          monthName: MONTH_NAMES[month - 1],
          totalSales: monthSalesTotal,
          totalExpenditures: monthExpTotal,
          totalPurchases: monthPurchasesTotal,
          remainingSupplierAmount: monthRemainingSupplier,
          remainingCustomerAmount: monthRemainingCustomer,
          profit: monthSalesTotal - monthExpTotal - monthPurchasesTotal,
          salesCount: monthSales.length,
          expendituresCount: monthExpenditures.length,
          purchasesCount: monthPurchases.length,
          dailyBreakdown: [],
        });
      }
    }

    return {
      success: true,
      data: {
        year,
        totalSales,
        totalExpenditures,
        totalPurchases,
        remainingSupplierAmount,
        remainingCustomerAmount,
        profit: totalSales - totalExpenditures - totalPurchases,
        salesCount: sales.length,
        expendituresCount: expenditures.length,
        purchasesCount: purchases.length,
        monthlyBreakdown,
      },
    };
  } catch (error) {
    console.error("Error fetching yearly report:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch yearly report",
    };
  }
}

// GET FINANCIAL YEAR REPORT (April to March)
export async function getFinancialYearReport(
  financialYear: number
): Promise<ActionResponse<FinancialYearReport>> {
  try {
    const startYear = financialYear;
    const endYear = financialYear + 1;

    // April of start year to March of end year
    const startDate = new Date(startYear, 3, 1); // April 1
    const endDate = new Date(endYear, 2, 31, 23, 59, 59, 999); // March 31

    // Fetch sales
    const sales = await prisma.sale.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Fetch expenditures
    const expenditures = await prisma.expenditure.findMany({
      where: {
        OR: [
          { year: startYear, month: { gte: 4, lte: 12 } },
          { year: endYear, month: { gte: 1, lte: 3 } },
        ],
      },
    });

    // Fetch purchases
    const purchases = await prisma.purchase.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    const totalSales = sales.reduce((sum, sale) => sum + (sale.totalAmount - sale.balanceAmount), 0);
    const totalExpenditures = expenditures.reduce((sum, exp) => sum + exp.amount, 0);
    const totalPurchases = purchases.reduce((sum, purchase) => sum + purchase.paidAmount, 0);
    const remainingSupplierAmount = purchases.reduce((sum, purchase) => sum + (purchase.total - purchase.paidAmount), 0);
    const remainingCustomerAmount = sales.reduce((sum, sale) => sum + sale.balanceAmount, 0);

    // Monthly breakdown (April to March)
    const monthlyBreakdown = [];
    const fyMonths = [
      { month: 4, year: startYear, name: 'April' },
      { month: 5, year: startYear, name: 'May' },
      { month: 6, year: startYear, name: 'June' },
      { month: 7, year: startYear, name: 'July' },
      { month: 8, year: startYear, name: 'August' },
      { month: 9, year: startYear, name: 'September' },
      { month: 10, year: startYear, name: 'October' },
      { month: 11, year: startYear, name: 'November' },
      { month: 12, year: startYear, name: 'December' },
      { month: 1, year: endYear, name: 'January' },
      { month: 2, year: endYear, name: 'February' },
      { month: 3, year: endYear, name: 'March' },
    ];

    for (const { month, year, name } of fyMonths) {
      const monthStart = new Date(year, month - 1, 1);
      const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);

      const monthSales = sales.filter(
        (s) => s.date >= monthStart && s.date <= monthEnd
      );
      const monthExpenditures = expenditures.filter(
        (e) => e.year === year && e.month === month
      );
      const monthPurchases = purchases.filter(
        (p) => p.date >= monthStart && p.date <= monthEnd
      );

      const monthSalesTotal = monthSales.reduce((sum, sale) => sum + (sale.totalAmount - sale.balanceAmount), 0);
      const monthExpTotal = monthExpenditures.reduce((sum, exp) => sum + exp.amount, 0);
      const monthPurchasesTotal = monthPurchases.reduce((sum, purchase) => sum + purchase.paidAmount, 0);
      const monthRemainingSupplier = monthPurchases.reduce((sum, purchase) => sum + (purchase.total - purchase.paidAmount), 0);
      const monthRemainingCustomer = monthSales.reduce((sum, sale) => sum + sale.balanceAmount, 0);

      monthlyBreakdown.push({
        month,
        year,
        monthName: name,
        totalSales: monthSalesTotal,
        totalExpenditures: monthExpTotal,
        totalPurchases: monthPurchasesTotal,
        remainingSupplierAmount: monthRemainingSupplier,
        remainingCustomerAmount: monthRemainingCustomer,
        profit: monthSalesTotal - monthExpTotal - monthPurchasesTotal,
      });
    }

    return {
      success: true,
      data: {
        financialYear: `${startYear}-${endYear.toString().slice(-2)}`,
        totalSales,
        totalExpenditures,
        totalPurchases,
        remainingSupplierAmount,
        remainingCustomerAmount,
        profit: totalSales - totalExpenditures - totalPurchases,
        salesCount: sales.length,
        expendituresCount: expenditures.length,
        purchasesCount: purchases.length,
        monthlyBreakdown,
      },
    };
  } catch (error) {
    console.error("Error fetching financial year report:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch financial year report",
    };
  }
}
