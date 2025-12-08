/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Loader2,
  Calendar,
  TrendingUp,
  DollarSign,
  Eye,
  Search,
  X,
  Filter,
  ArrowUpDown,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getPendingPurchasesWithFilters,
  getPendingBillsStats,
  PurchaseListItem,
  PendingBillsStats,
} from "@/actions/purchase-actions";
import { PendingBillPaymentDialog } from "@/components/PendingBillPaymentDialog";

export default function PendingBillsPage() {
  const [purchases, setPurchases] = useState<PurchaseListItem[]>([]);
  const [stats, setStats] = useState<PendingBillsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<"all" | "monthly" | "yearly">("all");
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const currentDate = new Date();
  const currentFY = currentDate.getMonth() >= 3 ? currentDate.getFullYear() : currentDate.getFullYear() - 1;
  const [selectedFY, setSelectedFY] = useState<number>(currentFY);
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<string | null>(null);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [groupBySupplier, setGroupBySupplier] = useState(false);
  
  // Additional filters
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("all");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "amount" | "supplier">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const dateFilter = 
        filterType === "monthly" 
          ? { type: "monthly" as const, month: selectedMonth }
          : filterType === "yearly"
          ? { type: "yearly" as const, year: selectedFY }
          : { type: "all" as const };

      const [purchasesRes, statsRes] = await Promise.all([
        getPendingPurchasesWithFilters(dateFilter),
        getPendingBillsStats(dateFilter),
      ]);
      
      if (purchasesRes.success && purchasesRes.data) {
        setPurchases(purchasesRes.data);
      }
      
      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  }, [filterType, selectedMonth, selectedFY]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePaymentSuccess = () => {
    setShowPaymentDialog(false);
    setSelectedPurchaseId(null);
    loadData();
  };

  const handleMakePayment = (purchaseId: string) => {
    setSelectedPurchaseId(purchaseId);
    setShowPaymentDialog(true);
  };

  // Get unique suppliers
  const uniqueSuppliers = Array.from(
    new Set(purchases.map((p) => p.supplierName).filter(Boolean))
  ).sort();

  // Filter and sort purchases
  const filteredPurchases = purchases
    .filter((purchase) => {
      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchesProduct = purchase.productName.toLowerCase().includes(search);
        const matchesSupplier = purchase.supplierName?.toLowerCase().includes(search);
        if (!matchesProduct && !matchesSupplier) return false;
      }

      // Supplier filter
      if (supplierFilter !== "all" && purchase.supplierName !== supplierFilter) {
        return false;
      }

      // Amount range filter
      if (minAmount && purchase.pendingAmount < parseFloat(minAmount)) {
        return false;
      }
      if (maxAmount && purchase.pendingAmount > parseFloat(maxAmount)) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case "date":
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case "amount":
          comparison = a.pendingAmount - b.pendingAmount;
          break;
        case "supplier":
          comparison = (a.supplierName || "").localeCompare(b.supplierName || "");
          break;
      }
      
      return sortOrder === "asc" ? comparison : -comparison;
    });

  const clearAllFilters = () => {
    setSearchTerm("");
    setSupplierFilter("all");
    setMinAmount("");
    setMaxAmount("");
    setSortBy("date");
    setSortOrder("desc");
  };

  const hasActiveFilters = searchTerm || supplierFilter !== "all" || minAmount || maxAmount;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Pending Bills</h1>
              <p className="text-muted-foreground">Track outstanding supplier payments</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Total Pending Amount
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">
                ₹{stats?.totalPending.toFixed(2) || "0.00"}
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Pending Bills
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.billCount || 0}</div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Average Bill Amount
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{stats?.averageBill.toFixed(2) || "0.00"}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters & Search
              </CardTitle>
              <div className="flex items-center gap-2">
                {hasActiveFilters && (
                  <>
                    <Badge variant="secondary" className="gap-1">
                      {[searchTerm && 1, supplierFilter !== "all" && 1, (minAmount || maxAmount) && 1].filter(Boolean).length} active
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllFilters}
                      className="gap-1 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                      Clear All
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Period Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Filter by Period</label>
              <div className="flex gap-2 flex-wrap mb-3">
                <Button
                  variant={filterType === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterType("all")}
                >
                  All Bills
                </Button>
                <Button
                  variant={filterType === "monthly" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterType("monthly")}
                >
                  Monthly
                </Button>
                <Button
                  variant={filterType === "yearly" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterType("yearly")}
                >
                  Yearly
                </Button>
              </div>

              {/* Time Selection */}
              {filterType === "monthly" && (
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-3 py-2 border border-input rounded-md bg-background text-foreground w-full max-w-xs"
                />
              )}

              {filterType === "yearly" && (
                <select
                  value={selectedFY}
                  onChange={(e) => setSelectedFY(parseInt(e.target.value))}
                  className="px-3 py-2 border border-input rounded-md bg-background text-foreground w-full max-w-xs"
                >
                  {[...Array(10)].map((_, i) => {
                    const fy = currentFY - i;
                    return (
                      <option key={fy} value={fy}>
                        FY {fy}-{(fy + 1) % 100}
                      </option>
                    );
                  })}
                </select>
              )}
            </div>

            <div className="border-t pt-4">
              <Button
                variant={showFilters ? "default" : "outline"}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2 mb-4"
              >
                <Search className="h-4 w-4" />
                {showFilters ? "Hide Search & Filters" : "Show Search & Filters"}
              </Button>

              <div
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  showFilters ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by product or supplier name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Supplier Filter */}
              <div>
                <label className="text-sm font-medium mb-2 block">Supplier</label>
                <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All suppliers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Suppliers</SelectItem>
                    {uniqueSuppliers.map((supplier) => (
                      <SelectItem key={supplier} value={supplier}>
                        {supplier}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Min Amount */}
              <div>
                <label className="text-sm font-medium mb-2 block">Min Amount</label>
                <Input
                  type="number"
                  placeholder="₹0"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                  min="0"
                />
              </div>

              {/* Max Amount */}
              <div>
                <label className="text-sm font-medium mb-2 block">Max Amount</label>
                <Input
                  type="number"
                  placeholder="₹999999"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                  min="0"
                />
              </div>

              {/* Sort By */}
              <div>
                <label className="text-sm font-medium mb-2 block">Sort By</label>
                <div className="flex gap-2">
                  <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="amount">Amount</SelectItem>
                      <SelectItem value="supplier">Supplier</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                    title={sortOrder === "asc" ? "Ascending" : "Descending"}
                  >
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

                  {/* Results Count */}
                  <div className="text-sm text-muted-foreground pt-2 border-t">
                    Showing {filteredPurchases.length} of {purchases.length} bills
                    {hasActiveFilters && " (filtered)"}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Supplier Grouping */}
        {stats && stats.bySupplier.length > 0 && (
          <Card className="mb-6 shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Pending by Supplier</CardTitle>
                <Button
                  variant={groupBySupplier ? "default" : "outline"}
                  size="sm"
                  onClick={() => setGroupBySupplier(!groupBySupplier)}
                >
                  {groupBySupplier ? "Show All" : "Group View"}
                </Button>
              </div>
            </CardHeader>
            {groupBySupplier && (
              <CardContent>
                <div className="space-y-3">
                  {stats.bySupplier.map((supplier, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div>
                        <div className="font-medium">{supplier.supplierName}</div>
                        <div className="text-sm text-muted-foreground">
                          {supplier.count} {supplier.count === 1 ? "bill" : "bills"}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-destructive">
                          ₹{supplier.totalPending.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        )}

        {/* Pending Bills Table */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>
              Pending Bills {filterType === "monthly" ? `(${selectedMonth})` : filterType === "yearly" ? `(FY ${selectedFY}-${selectedFY + 1})` : ""}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredPurchases.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <DollarSign className="mx-auto h-12 w-12 text-muted-foreground/40 mb-4" />
                <p className="text-base font-medium">
                  {hasActiveFilters ? "No bills match your filters" : "No pending bills found"}
                </p>
                <p className="text-sm mt-1">
                  {hasActiveFilters 
                    ? "Try adjusting your search criteria or clear filters."
                    : filterType !== "all" 
                    ? "Try selecting a different time period."
                    : "All supplier payments are up to date."}
                </p>
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearAllFilters}
                    className="mt-4 gap-2"
                  >
                    <X className="h-4 w-4" />
                    Clear All Filters
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="font-medium">Date</TableHead>
                      <TableHead className="font-medium">Product</TableHead>
                      <TableHead className="text-right font-medium">Total Amount</TableHead>
                      <TableHead className="text-right font-medium">Paid Amount</TableHead>
                      <TableHead className="text-right font-medium">Pending Amount</TableHead>
                      <TableHead className="font-medium">Supplier</TableHead>
                      <TableHead className="font-medium">Status</TableHead>
                      <TableHead className="text-center font-medium">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPurchases.map((purchase) => (
                      <TableRow key={purchase._id}>
                        <TableCell className="font-medium">
                          {new Date(purchase.date).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </TableCell>
                        <TableCell className="font-medium">{purchase.productName}</TableCell>
                        <TableCell className="text-right">₹{purchase.total.toFixed(2)}</TableCell>
                        <TableCell className="text-right text-green-600 font-semibold">
                          ₹{purchase.paidAmount.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right text-destructive font-bold">
                          ₹{purchase.pendingAmount.toFixed(2)}
                        </TableCell>
                        <TableCell>{purchase.supplierName || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="destructive">{purchase.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-2">
                            <Link href={`/stock/product/${purchase.productId}`}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                View
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleMakePayment(purchase._id)}
                              className="gap-1"
                            >
                              <DollarSign className="h-3.5 w-3.5" />
                              Pay
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Payment Dialog */}
      {selectedPurchaseId && (
        <PendingBillPaymentDialog
          open={showPaymentDialog}
          onOpenChange={setShowPaymentDialog}
          purchaseId={selectedPurchaseId}
          purchase={purchases.find(p => p._id === selectedPurchaseId)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  );
}
