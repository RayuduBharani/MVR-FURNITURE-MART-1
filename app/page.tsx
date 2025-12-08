"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { 
  Package, 
  Sofa, 
  ShoppingCart, 
  ClipboardList, 
  Banknote,
  BarChart3,
  Store,
  TrendingUp,
  TrendingDown,
  IndianRupee,
  Activity,
  FileText,
  AlertCircle,
  Clock,
  ArrowUpRight,
  Loader2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getDashboardStats, getRecentActivities, type DashboardStats, type RecentActivity } from "@/actions/dashboard-actions";

export default function AdminDashboard() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalSales: 0,
    todaySales: 0,
    pendingBills: 0,
    lowStock: 0,
    monthlyRevenue: 0,
    monthlyExpenses: 0,
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  
  useEffect(() => {
    setMounted(true);
    fetchDashboardData();
  }, []);
  
  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsResult, activitiesResult] = await Promise.all([
        getDashboardStats(),
        getRecentActivities(),
      ]);

      if (statsResult.success && statsResult.data) {
        setStats(statsResult.data);
      }

      if (activitiesResult.success && activitiesResult.data) {
        setRecentActivities(activitiesResult.data);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const currentDate = mounted 
    ? new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  const quickActions = [
    {
      name: "Stock & Inventory",
      icon: Package,
      href: "/stock",
      description: "Manage products and track inventory",
      color: "bg-blue-500",
      stats: loading ? "Loading..." : `${stats.lowStock} low stock items`
    },
    {
      name: "Products Catalog",
      icon: Sofa,
      href: "/products",
      description: "View and manage product listings",
      color: "bg-purple-500",
      stats: "View all products"
    },
    {
      name: "Billing & Sales",
      icon: ShoppingCart,
      href: "/sales",
      description: "Create invoices and track sales",
      color: "bg-green-500",
      stats: loading ? "Loading..." : `${stats.todaySales} sales today`
    },
    {
      name: "Pending Bills",
      icon: ClipboardList,
      href: "/pending-bills",
      description: "Track pending payments",
      color: "bg-orange-500",
      stats: loading ? "Loading..." : `${stats.pendingBills} pending`
    },
    {
      name: "Expenditures",
      icon: Banknote,
      href: "/expenditures",
      description: "Track shop expenses",
      color: "bg-red-500",
      stats: loading ? "Loading..." : `₹${(stats.monthlyExpenses / 1000).toFixed(0)}K this month`
    },
    {
      name: "Reports",
      icon: BarChart3,
      href: "/reports",
      description: "View financial reports",
      color: "bg-indigo-500",
      stats: "View analytics"
    },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "sale":
        return ShoppingCart;
      case "expense":
        return Banknote;
      case "stock":
        return AlertCircle;
      default:
        return Activity;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case "sale":
        return "text-green-500";
      case "expense":
        return "text-red-500";
      case "stock":
        return "text-orange-500";
      default:
        return "text-blue-500";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary shadow-md">
                <Store className="w-7 h-7 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">MVR Furniture Mart</h1>
                <p className="text-sm text-muted-foreground">Admin Management Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Welcome back, Admin</p>
                <p className="text-xs text-muted-foreground">
                  {currentDate || 'Loading...'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Today's Sales */}
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Today&apos;s Sales</CardTitle>
              <ShoppingCart className="w-5 h-5 text-primary" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <div className="text-3xl font-bold text-foreground">{stats.todaySales}</div>
                  <p className="text-xs text-muted-foreground mt-1">Sales recorded today</p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Monthly Revenue */}
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Revenue</CardTitle>
              <TrendingUp className="w-5 h-5 text-primary" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <div className="text-3xl font-bold text-foreground">₹{(stats.monthlyRevenue / 1000).toFixed(1)}K</div>
                  <p className="text-xs text-muted-foreground mt-1">Revenue this month</p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Pending Bills */}
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Bills</CardTitle>
              <ClipboardList className="w-5 h-5 text-destructive" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <div className="text-3xl font-bold text-foreground">{stats.pendingBills}</div>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-destructive" />
                    Requires attention
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* Low Stock Alert */}
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock Items</CardTitle>
              <AlertCircle className="w-5 h-5 text-destructive" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <div className="text-3xl font-bold text-foreground">{stats.lowStock}</div>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-destructive" />
                    Need restock
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions Grid */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">Quick Actions</h2>
            <Badge variant="outline" className="text-sm">
              <Activity className="w-3 h-3 mr-1" />
              Management Tools
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.name} href={action.href}>
                  <Card className="group h-full shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`p-3 rounded-lg ${action.color} group-hover:scale-110 transition-transform`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <ArrowUpRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                      </div>
                      
                      <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition">
                        {action.name}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        {action.description}
                      </p>
                      <div className="flex items-center">
                        <Badge variant="secondary" className="text-xs">
                          {action.stats}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Activity Feed */}
          <Card className="lg:col-span-2 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : recentActivities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">No recent activities</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentActivities.map((activity, index) => {
                    const ActivityIcon = getActivityIcon(activity.type);
                    const activityColor = getActivityColor(activity.type);
                    return (
                      <div key={index} className="flex items-start gap-4 p-3 rounded-lg hover:bg-accent transition">
                        <div className={`p-2 rounded-full bg-muted ${activityColor}`}>
                          <ActivityIcon className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">{activity.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Summary */}
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Quick Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <>
                  <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-foreground">Revenue</span>
                      <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">₹{(stats.monthlyRevenue / 1000).toFixed(1)}K</p>
                    <p className="text-xs text-muted-foreground mt-1">This month</p>
                  </div>

                  <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-foreground">Expenses</span>
                      <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                    </div>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">₹{(stats.monthlyExpenses / 1000).toFixed(1)}K</p>
                    <p className="text-xs text-muted-foreground mt-1">This month</p>
                  </div>

                  <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-foreground">Net Profit</span>
                      <IndianRupee className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">₹{((stats.monthlyRevenue - stats.monthlyExpenses) / 1000).toFixed(1)}K</p>
                    <p className="text-xs text-muted-foreground mt-1">This month</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}