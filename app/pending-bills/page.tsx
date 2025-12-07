"use client";

import { useState, useEffect } from "react";
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
} from "lucide-react";
import {
  getPurchasesByProduct,
  PurchaseListItem,
} from "@/actions/purchase-actions";
import { getProducts, ProductData } from "@/actions/product-actions";

export default function PendingBillsPage() {
  const [purchases, setPurchases] = useState<PurchaseListItem[]>([]);
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<"all" | "monthly" | "yearly">("all");
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const currentDate = new Date();
  const currentFY = currentDate.getMonth() >= 3 ? currentDate.getFullYear() : currentDate.getFullYear() - 1;
  const [selectedFY, setSelectedFY] = useState<string>(currentFY.toString());

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [productsRes] = await Promise.all([getProducts()]);
      
      if (productsRes.success && productsRes.data) {
        setProducts(productsRes.data);
        
        // Fetch purchases for all products
        const allPurchases: PurchaseListItem[] = [];
        for (const product of productsRes.data) {
          const purchasesRes = await getPurchasesByProduct(product._id);
          if (purchasesRes.success && purchasesRes.data) {
            allPurchases.push(...purchasesRes.data);
          }
        }
        setPurchases(allPurchases);
      }
    } catch {
      console.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  // Filter pending purchases
  const pendingPurchases = purchases.filter(p => p.status === "PENDING" && p.pendingAmount > 0);

  // Apply time filter
  const filteredPurchases = pendingPurchases.filter((purchase) => {
    const purchaseDate = new Date(purchase.date);
    
    if (filterType === "monthly") {
      const purchaseMonth = purchaseDate.toISOString().slice(0, 7);
      return purchaseMonth === selectedMonth;
    }
    
    if (filterType === "yearly") {
      // Financial year: April (month 3) to March (month 2)
      const purchaseMonth = purchaseDate.getMonth();
      const purchaseYear = purchaseDate.getFullYear();
      
      const fy = purchaseMonth >= 3 ? purchaseYear : purchaseYear - 1;
      return fy.toString() === selectedFY;
    }
    
    return true;
  });

  // Calculate totals
  const totalPending = filteredPurchases.reduce((sum, p) => sum + p.pendingAmount, 0);
  const totalPurchases = filteredPurchases.length;
  const averageBill = totalPurchases > 0 ? totalPending / totalPurchases : 0;

  // Get product name
  function getProductName(productId: string) {
    return products.find(p => p._id === productId)?.name || "Unknown Product";
  }

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
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Total Pending Amount</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totalPending.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Pending Bills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPurchases}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">Average Bill Amount</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{averageBill.toFixed(2)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Buttons */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Filter by Period</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={filterType === "all" ? "default" : "outline"}
                onClick={() => setFilterType("all")}
                className="gap-2"
              >
                <Calendar className="w-4 h-4" />
                All Bills
              </Button>
              <Button
                variant={filterType === "monthly" ? "default" : "outline"}
                onClick={() => setFilterType("monthly")}
                className="gap-2"
              >
                <Calendar className="w-4 h-4" />
                Monthly
              </Button>
              <Button
                variant={filterType === "yearly" ? "default" : "outline"}
                onClick={() => setFilterType("yearly")}
                className="gap-2"
              >
                <TrendingUp className="w-4 h-4" />
                Yearly
              </Button>
            </div>

            {/* Time Selection */}
            {filterType === "monthly" && (
              <div>
                <label className="text-sm font-medium">Select Month</label>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="mt-1 px-3 py-2 border border-input rounded-md bg-background text-foreground w-full"
                />
              </div>
            )}

            {filterType === "yearly" && (
              <div>
                <label className="text-sm font-medium">Select Financial Year</label>
                <select
                  value={selectedFY}
                  onChange={(e) => setSelectedFY(e.target.value)}
                  className="mt-1 px-3 py-2 border border-input rounded-md bg-background text-foreground w-full"
                >
                  {[...Array(10)].map((_, i) => {
                    const fy = currentFY - i;
                    return (
                      <option key={fy} value={fy.toString()}>
                        FY {fy}-{(fy + 1) % 100}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Bills Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              Pending Bills {filterType === "monthly" ? `(${selectedMonth})` : filterType === "yearly" ? `(FY ${selectedFY}-${(parseInt(selectedFY) + 1) % 100})` : ""}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredPurchases.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No pending bills found for the selected period.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                    <TableHead className="text-right">Paid Amount</TableHead>
                    <TableHead className="text-right">Pending Amount</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPurchases.map((purchase) => (
                    <TableRow key={purchase._id}>
                      <TableCell>{new Date(purchase.date).toLocaleDateString()}</TableCell>
                      <TableCell className="font-medium">{getProductName(purchase.productId)}</TableCell>
                      <TableCell className="text-right">₹{purchase.total.toFixed(2)}</TableCell>
                      <TableCell className="text-right text-green-600">₹{purchase.paidAmount.toFixed(2)}</TableCell>
                      <TableCell className="text-right text-destructive font-semibold">
                        ₹{purchase.pendingAmount.toFixed(2)}
                      </TableCell>
                      <TableCell>{purchase.supplierName || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="destructive">{purchase.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
