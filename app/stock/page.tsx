"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Plus, 
  Package, 
  ArrowLeft,
  Loader2,
  AlertCircle,
  Eye,
  Search,
  X,
  ChevronDown
} from "lucide-react";
import { 
  getProducts, 
  createProduct,
  ProductData 
} from "@/actions/product-actions";
import { 
  getPendingBillsTotal
} from "@/actions/purchase-actions";

export default function StockPage() {
  const [products, setProducts] = useState<ProductData[]>([]);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Filter states
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Product form state
  const [productForm, setProductForm] = useState({
    name: "",
    category: "",
    purchasePrice: "",
    sellingPrice: "",
    stock: "0",
    supplierName: "",
  });

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [productsRes, pendingRes] = await Promise.all([
        getProducts(),
        getPendingBillsTotal(),
      ]);

      if (productsRes.success && productsRes.data) {
        setProducts(productsRes.data);
      }
      if (pendingRes.success && pendingRes.data !== undefined) {
        setPendingTotal(pendingRes.data);
      }
    } catch {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  // Get unique categories and suppliers
  const uniqueCategories = [...new Set(products.map(p => p.category).filter(Boolean))].sort();
  const uniqueSuppliers = [...new Set(products.map(p => p.supplierName).filter(Boolean))].sort();

  // Filter products
  const filteredProducts = products.filter((product) => {
    // Search filter
    if (searchText && !product.name.toLowerCase().includes(searchText.toLowerCase())) {
      return false;
    }
    
    // Category filter
    if (selectedCategory && product.category !== selectedCategory) {
      return false;
    }
    
    // Supplier filter
    if (selectedSupplier && product.supplierName !== selectedSupplier) {
      return false;
    }
    
    return true;
  });

  // Reset filters
  function resetFilters() {
    setSearchText("");
    setSelectedCategory("");
    setSelectedSupplier("");
  }

  // Check if any filter is active
  const hasActiveFilters = searchText || selectedCategory || selectedSupplier;

  // Handle create product
  async function handleCreateProduct(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const result = await createProduct({
      name: productForm.name,
      category: productForm.category,
      purchasePrice: parseFloat(productForm.purchasePrice) || 0,
      sellingPrice: parseFloat(productForm.sellingPrice) || 0,
      stock: parseInt(productForm.stock) || 0,
      supplierName: productForm.supplierName,
    });

    if (result.success) {
      setIsAddProductOpen(false);
      setProductForm({ name: "", category: "", purchasePrice: "", sellingPrice: "", stock: "0", supplierName: "" });
      loadData();
    } else {
      setError(result.error || "Failed to create product");
    }
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground font-medium">Loading inventory...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary">
                  <Package className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Stock & Inventory</h1>
                  <p className="text-sm text-muted-foreground">Manage products and track inventory</p>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Product
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Product</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateProduct} className="space-y-4">
                    <div>
                      <Label htmlFor="name">Product Name *</Label>
                      <Input
                        id="name"
                        value={productForm.name}
                        onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                        placeholder="Enter product name"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Input
                        id="category"
                        value={productForm.category}
                        onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                        placeholder="e.g., Sofa, Bed, Table"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="purchasePrice">Purchase Price</Label>
                        <Input
                          id="purchasePrice"
                          type="text"
                          value={productForm.purchasePrice}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '' || /^\d*\.?\d*$/.test(value)) {
                              setProductForm({ ...productForm, purchasePrice: value });
                            }
                          }}
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <Label htmlFor="sellingPrice">Selling Price</Label>
                        <Input
                          id="sellingPrice"
                          type="text"
                          value={productForm.sellingPrice}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '' || /^\d*\.?\d*$/.test(value)) {
                              setProductForm({ ...productForm, sellingPrice: value });
                            }
                          }}
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="stock">Initial Stock</Label>
                      <Input
                        id="stock"
                        type="text"
                        value={productForm.stock}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '' || /^\d+$/.test(value)) {
                            setProductForm({ ...productForm, stock: value || '0' });
                          }
                        }}
                        onFocus={(e) => e.target.select()}
                        placeholder="0"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Enter initial stock quantity</p>
                    </div>
                    <div>
                      <Label htmlFor="supplierName">Supplier Name</Label>
                      <Input
                        id="supplierName"
                        value={productForm.supplierName}
                        onChange={(e) => setProductForm({ ...productForm, supplierName: e.target.value })}
                        placeholder="Enter supplier name"
                      />
                    </div>
                    {error && <p className="text-destructive text-sm">{error}</p>}
                    <Button type="submit" className="w-full" disabled={submitting}>
                      {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Create Product
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Products</CardTitle>
              <Package className="w-5 h-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{products.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Products in inventory</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock Items</CardTitle>
              <AlertCircle className="w-5 h-5 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{products.filter(p => p.stock <= 5).length}</div>
              <p className="text-xs text-muted-foreground mt-1">Need restock</p>
            </CardContent>
          </Card>
          
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Bills</CardTitle>
              <AlertCircle className="w-5 h-5 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">₹{(pendingTotal / 1000).toFixed(1)}K</div>
              <p className="text-xs text-muted-foreground mt-1">Outstanding amount</p>
            </CardContent>
          </Card>
        </div>

        {/* Products List */}
        <Card className="mb-8 shadow-md">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold">Products Inventory</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">View and manage all products</p>
              </div>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetFilters}
                  className="gap-2"
                >
                  <X className="w-4 h-4" />
                  Clear Filters
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            {/* Filters Section */}
            <div className="border rounded-lg overflow-hidden">
              {/* Filter Header */}
              <button
                onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                className="w-full px-4 py-3 bg-muted hover:bg-muted/80 flex items-center justify-between transition-colors"
              >
                <h3 className="font-semibold text-sm">Filters & Search</h3>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-200 ${isFiltersOpen ? "rotate-180" : "rotate-0"}`}
                />
              </button>

              {/* Filter Content */}
              {isFiltersOpen && (
                <div className="bg-muted/50 p-4 space-y-4 border-t">
                  {/* Search */}
                  <div>
                    <Label htmlFor="search" className="text-xs font-medium">Search by Name</Label>
                    <div className="relative mt-1">
                      <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="search"
                        placeholder="Search products..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Category and Supplier filters */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="category" className="text-xs font-medium">Category</Label>
                      <select
                        id="category"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm focus:border-ring focus:ring-1 focus:ring-ring outline-none"
                      >
                        <option value="">All Categories</option>
                        {uniqueCategories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="supplier" className="text-xs font-medium">Supplier</Label>
                      <select
                        id="supplier"
                        value={selectedSupplier}
                        onChange={(e) => setSelectedSupplier(e.target.value)}
                        className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm focus:border-ring focus:ring-1 focus:ring-ring outline-none"
                      >
                        <option value="">All Suppliers</option>
                        {uniqueSuppliers.map((sup) => (
                          <option key={sup} value={sup}>
                            {sup}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Results count */}
                  <div className="text-xs text-muted-foreground pt-2 border-t bg-card -mx-4 -mb-4 px-4 py-3 rounded-b-lg">
                    <span className="font-medium">Showing {filteredProducts.length} of {products.length} products</span>
                  </div>
                </div>
              )}
            </div>

            {/* Products Table */}
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12 bg-muted/50 rounded-lg border-2 border-dashed">
                <Package className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                <p className="text-foreground font-medium">
                  {products.length === 0 
                    ? "No products yet"
                    : "No products match your filters"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {products.length === 0 
                    ? "Add your first product to get started."
                    : "Try adjusting your search or filters."}
                </p>
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted hover:bg-muted">
                      <TableHead className="font-semibold">Name</TableHead>
                      <TableHead className="font-semibold">Category</TableHead>
                      <TableHead className="font-semibold">Supplier</TableHead>
                      <TableHead className="text-right font-semibold">Purchase Price</TableHead>
                      <TableHead className="text-right font-semibold">Selling Price</TableHead>
                      <TableHead className="text-right font-semibold">Stock</TableHead>
                      <TableHead className="text-right font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredProducts.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell className="text-muted-foreground">{product.category || "-"}</TableCell>
                        <TableCell className="text-muted-foreground">{product.supplierName || "-"}</TableCell>
                        <TableCell className="text-right">₹{product.purchasePrice.toFixed(2)}</TableCell>
                        <TableCell className="text-right">₹{product.sellingPrice.toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          <Badge 
                            variant={product.stock > 5 ? "default" : product.stock > 0 ? "secondary" : "destructive"}
                          >
                            {product.stock}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Link href={`/stock/product/${product.id}`}>
                            <Button size="sm" variant="ghost">
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          </Link>
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
    </div>
  );
}
