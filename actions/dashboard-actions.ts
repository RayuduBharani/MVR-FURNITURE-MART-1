"use server";

import connectDB from "@/lib/mongodb";
import Sale from "@/models/Sale";
import Product from "@/models/Product";
import Expenditure from "@/models/Expenditure";

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

export async function getDashboardStats(): Promise<ActionResponse<DashboardStats>> {
  try {
    await connectDB();

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    // Get today's sales count
    const todaySalesCount = await Sale.countDocuments({
      date: { $gte: today, $lt: tomorrow },
    });

    // Get total sales count
    const totalSalesCount = await Sale.countDocuments();

    // Get pending bills count
    const pendingBillsCount = await Sale.countDocuments({
      status: "PENDING",
    });

    // Get low stock products (stock <= 5)
    const lowStockCount = await Product.countDocuments({
      stock: { $lte: 5 },
    });

    // Get monthly revenue (sum of all sales this month)
    const monthlyRevenue = await Sale.aggregate([
      {
        $match: {
          date: {
            $gte: new Date(currentYear, currentMonth - 1, 1),
            $lt: new Date(currentYear, currentMonth, 1),
          },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$totalAmount" },
        },
      },
    ]);

    // Get monthly expenses
    const monthlyExpenses = await Expenditure.aggregate([
      {
        $match: {
          year: currentYear,
          month: currentMonth,
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);

    return {
      success: true,
      data: {
        todaySales: todaySalesCount,
        totalSales: totalSalesCount,
        pendingBills: pendingBillsCount,
        lowStock: lowStockCount,
        monthlyRevenue: monthlyRevenue[0]?.total || 0,
        monthlyExpenses: monthlyExpenses[0]?.total || 0,
      },
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch dashboard stats";
    return {
      success: false,
      error: errorMessage,
    };
  }
}

export async function getRecentActivities(): Promise<ActionResponse<RecentActivity[]>> {
  try {
    await connectDB();

    const activities: RecentActivity[] = [];

    // Get recent sales (last 5)
    const recentSales = await Sale.find()
      .sort({ date: -1 })
      .limit(5)
      .select("customerName totalAmount date _id");

    recentSales.forEach((sale) => {
      activities.push({
        type: "sale",
        message: `New sale to ${sale.customerName} - ₹${sale.totalAmount.toLocaleString()}`,
        time: getTimeAgo(sale.date),
        timestamp: sale.date,
      });
    });

    // Get recent expenditures (last 3)
    const recentExpenses = await Expenditure.find()
      .sort({ date: -1 })
      .limit(3)
      .select("category amount date");

    recentExpenses.forEach((expense) => {
      activities.push({
        type: "expense",
        message: `Expense added: ${expense.category} - ₹${expense.amount.toLocaleString()}`,
        time: getTimeAgo(expense.date),
        timestamp: expense.date,
      });
    });

    // Get low stock alerts
    const lowStockProducts = await Product.find({ stock: { $lte: 5 } })
      .sort({ stock: 1 })
      .limit(3)
      .select("name stock");

    lowStockProducts.forEach((product) => {
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
}

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
