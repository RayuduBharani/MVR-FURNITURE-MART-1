"use server";

import prisma from "@/lib/prisma";
import { cache } from "react";

export type DashboardStats = {
  todaySales: number;
  totalSales: number;
  pendingBills: number;
  lowStock: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
};

export type RecentActivity = {
  type: string;
  message: string;
  time: string;
  timestamp: Date;
};

export type ActionResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
};

export const getDashboardStats = cache(async function(): Promise<ActionResponse<DashboardStats>> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    // Get today's sales count
    const todaySalesCount = await prisma.sale.count({
      where: {
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    // Get total sales count
    const totalSalesCount = await prisma.sale.count();

    // Get pending bills count
    const pendingBillsCount = await prisma.sale.count({
      where: {
        status: "PENDING",
      },
    });

    // Get low stock products (stock <= 5)
    const lowStockCount = await prisma.product.count({
      where: {
        stock: {
          lte: 5,
        },
      },
    });

    // Get monthly revenue (sum of all sales this month)
    const monthlyRevenueResult = await prisma.sale.aggregate({
      where: {
        date: {
          gte: new Date(currentYear, currentMonth - 1, 1),
          lt: new Date(currentYear, currentMonth, 1),
        },
      },
      _sum: {
        totalAmount: true,
      },
    });

    // Get monthly expenses
    const monthlyExpensesResult = await prisma.expenditure.aggregate({
      where: {
        year: currentYear,
        month: currentMonth,
      },
      _sum: {
        amount: true,
      },
    });

    return {
      success: true,
      data: {
        todaySales: todaySalesCount,
        totalSales: totalSalesCount,
        pendingBills: pendingBillsCount,
        lowStock: lowStockCount,
        monthlyRevenue: monthlyRevenueResult._sum.totalAmount || 0,
        monthlyExpenses: monthlyExpensesResult._sum.amount || 0,
      },
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch dashboard stats";
    return {
      success: false,
      error: errorMessage,
    };
  }
});

//  add cache here
export const getRecentActivities = cache(async function(): Promise<ActionResponse<RecentActivity[]>> {
  try {
    const activities: RecentActivity[] = [];

    // Get recent sales (last 5)
    const recentSales = await prisma.sale.findMany({
      take: 5,
      orderBy: { date: 'desc' },
      select: {
        id: true,
        customerName: true,
        totalAmount: true,
        date: true,
      },
    });

    recentSales.forEach((sale: { id: string; customerName: string; totalAmount: number; date: Date }) => {
      activities.push({
        type: "sale",
        message: `New sale to ${sale.customerName} - ₹${sale.totalAmount.toLocaleString()}`,
        time: getTimeAgo(sale.date),
        timestamp: sale.date,
      });
    });

    // Get recent expenditures (last 3)
    const recentExpenses = await prisma.expenditure.findMany({
      take: 3,
      orderBy: { date: 'desc' },
      select: {
        category: true,
        amount: true,
        date: true,
      },
    });

    recentExpenses.forEach((expense: { category: string; amount: number; date: Date }) => {
      activities.push({
        type: "expense",
        message: `Expense added: ${expense.category} - ₹${expense.amount.toLocaleString()}`,
        time: getTimeAgo(expense.date),
        timestamp: expense.date,
      });
    });

    // Get low stock alerts
    const lowStockProducts = await prisma.product.findMany({
      where: {
        stock: {
          lte: 5,
        },
      },
      take: 3,
      orderBy: { stock: 'asc' },
      select: {
        name: true,
        stock: true,
      },
    });

    lowStockProducts.forEach((product: { name: string; stock: number }) => {
      activities.push({
        type: "stock",
        message: `Low stock alert: ${product.name} (${product.stock} left)`,
        time: "Recent",
        timestamp: new Date(),
      });
    });

    // Sort by timestamp descending and take top 10
    activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    const topActivities = activities.slice(0, 10);

    return {
      success: true,
      data: topActivities,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch recent activities";
    return {
      success: false,
      error: errorMessage,
    };
  }
});

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
  return date.toLocaleDateString();
}
