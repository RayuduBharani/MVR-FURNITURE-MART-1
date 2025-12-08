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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { 
  ArrowLeft,
  Loader2,
  Pencil,
  Trash2,
  Search,
  ChevronDown,
  SlidersHorizontal,
  Plus
} from "lucide-react";
import { 
  getProducts, 
  createProduct,
  updateProduct,
  deleteProduct,
  ProductData 
} from "@/actions/product-actions";

export default function ProductsPage() {
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingProduct, setEditingProduct] = useState<ProductData | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [minStock, setMinStock] = useState("");
  const [maxStock, setMaxStock] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  
  // Add product form state
  const [addForm, setAddForm] = useState({
    name: "",
    category: "",
    purchasePrice: "",
    sellingPrice: "",
    stock: "0",
    supplierName: "",
  });

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: "",
    category: "",
    purchasePrice: "",
    sellingPrice: "",
    stock: "",
  });

  // Load products
  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    setLoading(true);
    try {
      const result = await getProducts();
      if (result.success && result.data) {
        setProducts(result.data);
      }
    } catch {
      setError("Failed to load products");
    } finally {
      setLoading(false);
    }
  }

  // Open edit dialog
  function openEditDialog(product: ProductData) {
    setEditingProduct(product);
    setEditForm({
      name: product.name,
      category: product.category,
      purchasePrice: product.purchasePrice.toString(),
      sellingPrice: product.sellingPrice.toString(),
      stock: product.stock.toString(),
    });
    setIsEditOpen(true);
    setError("");
  }

  // Handle update product
  async function handleUpdateProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!editingProduct) return;

    setSubmitting(true);
    setError("");

    const result = await updateProduct(editingProduct._id, {
      name: editForm.name,
      category: editForm.category,
      purchasePrice: parseFloat(editForm.purchasePrice) || 0,
      sellingPrice: parseFloat(editForm.sellingPrice) || 0,
      stock: parseInt(editForm.stock) || 0,
    });

    if (result.success) {
      setIsEditOpen(false);
      setEditingProduct(null);
      loadProducts();
    } else {
      setError(result.error || "Failed to update product");
    }
    setSubmitting(false);
  }

  // Handle delete product
  async function handleDeleteProduct(id: string) {
    const result = await deleteProduct(id);
    if (result.success) {
      loadProducts();
    } else {
      setError(result.error || "Failed to delete product");
    }
  }

  // Handle add product
  async function handleAddProduct(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const result = await createProduct({
      name: addForm.name,
      category: addForm.category,
      purchasePrice: parseFloat(addForm.purchasePrice) || 0,
      sellingPrice: parseFloat(addForm.sellingPrice) || 0,
      stock: parseInt(addForm.stock) || 0,
      supplierName: addForm.supplierName,
    });

    if (result.success) {
      setIsAddOpen(false);
      setAddForm({
        name: "",
        category: "",
        purchasePrice: "",
        sellingPrice: "",
        stock: "0",
        supplierName: "",
      });
      loadProducts();
    } else {
      setError(result.error || "Failed to add product");
    }
    setSubmitting(false);
  }

  // Get unique categories
  const uniqueCategories = [...new Set(products.map(p => p.category).filter(Boolean))].sort();

  // Filter products
  const filteredProducts = products.filter((product) => {
    if (searchQuery && !product.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (selectedCategory && product.category !== selectedCategory) {
      return false;
    }
    if (minStock && parseInt(minStock) > product.stock) {
      return false;
    }
    if (maxStock && parseInt(maxStock) < product.stock) {
      return false;
    }
    return true;
  }).sort((a, b) => {
    // Sort by creation date (latest first)
    const dateA = new Date(a.createdAt || 0).getTime();
    const dateB = new Date(b.createdAt || 0).getTime();
    return dateB - dateA;
  });

  // Reset filters
  function resetFilters() {
    setSearchQuery("");
    setSelectedCategory("");
    setMinStock("");
    setMaxStock("");
    setCurrentPage(1);
  }

  const hasActiveFilters = searchQuery || selectedCategory || minStock || maxStock;

  // Pagination calculations
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, minStock, maxStock]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground font-medium">Loading products...</p>
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
                  <SlidersHorizontal className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Products Catalog</h1>
                  <p className="text-sm text-muted-foreground">View and manage all products</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
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
                  <form onSubmit={handleAddProduct} className="space-y-4">
                    <div>
                      <Label htmlFor="add-name">Product Name *</Label>
                      <Input
                        id="add-name"
                        value={addForm.name}
                        onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                        placeholder="Enter product name"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="add-category">Category</Label>
                      <Input
                        id="add-category"
                        value={addForm.category}
                        onChange={(e) => setAddForm({ ...addForm, category: e.target.value })}
                        placeholder="e.g., Sofa, Bed, Table"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="add-purchasePrice">Purchase Price</Label>
                        <Input
                          id="add-purchasePrice"
                          type="number"
                          min="0"
                          step="0.01"
                          value={addForm.purchasePrice}
                          onChange={(e) => setAddForm({ ...addForm, purchasePrice: e.target.value })}
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <Label htmlFor="add-sellingPrice">Selling Price</Label>
                        <Input
                          id="add-sellingPrice"
                          type="number"
                          min="0"
                          step="0.01"
                          value={addForm.sellingPrice}
                          onChange={(e) => setAddForm({ ...addForm, sellingPrice: e.target.value })}
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="add-stock">Stock</Label>
                        <Input
                          id="add-stock"
                          type="number"
                          min="0"
                          value={addForm.stock}
                          onChange={(e) => setAddForm({ ...addForm, stock: e.target.value })}
                          placeholder="0"
                        />
                      </div>
                      <div>
                        <Label htmlFor="add-supplierName">Supplier Name</Label>
                        <Input
                          id="add-supplierName"
                          value={addForm.supplierName}
                          onChange={(e) => setAddForm({ ...addForm, supplierName: e.target.value })}
                          placeholder="Supplier name"
                        />
                      </div>
                    </div>
                    {error && <p className="text-destructive text-sm">{error}</p>}
                    <Button type="submit" className="w-full" disabled={submitting}>
                      {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Add Product
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Products</CardTitle>
              <SlidersHorizontal className="w-5 h-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{products.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Products in catalog</p>
            </CardContent>
          </Card>
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Stock</CardTitle>
              <Search className="w-5 h-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{products.reduce((sum, p) => sum + p.stock, 0)}</div>
              <p className="text-xs text-muted-foreground mt-1">Units available</p>
            </CardContent>
          </Card>
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Inventory Value</CardTitle>
              <ChevronDown className="w-5 h-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">₹{(products.reduce((sum, p) => sum + (p.purchasePrice * p.stock), 0) / 1000).toFixed(1)}K</div>
              <p className="text-xs text-muted-foreground mt-1">Total inventory worth</p>
            </CardContent>
          </Card>
          <Card className="shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Out of Stock</CardTitle>
              <Trash2 className="w-5 h-5 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{products.filter(p => p.stock === 0).length}</div>
              <p className="text-xs text-muted-foreground mt-1">Need restock</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters Section */}
        <Card className="mb-6 shadow-md">
          <button
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
            className="flex items-center gap-2 px-4 py-3 bg-muted hover:bg-muted/80 transition-colors w-full rounded-t-lg"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="font-semibold text-sm">Filters & Search</span>
            <ChevronDown
              className={`w-4 h-4 ml-auto transition-transform duration-200 ${isFiltersOpen ? "rotate-180" : "rotate-0"}`}
            />
          </button>

          {isFiltersOpen && (
            <div className="border-t">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Category Filter */}
                  <div>
                    <Label htmlFor="category" className="text-sm mb-2 block">Category</Label>
                    <select
                      id="category"
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm"
                    >
                      <option value="">All Categories</option>
                      {uniqueCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Stock Range Filter */}
                  <div>
                    <Label className="text-sm mb-2 block">Stock Level</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        type="number"
                        min="0"
                        placeholder="Min"
                        value={minStock}
                        onChange={(e) => setMinStock(e.target.value)}
                      />
                      <Input
                        type="number"
                        min="0"
                        placeholder="Max"
                        value={maxStock}
                        onChange={(e) => setMaxStock(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Reset Button */}
                  {hasActiveFilters && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resetFilters}
                      className="w-full"
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              </CardContent>
            </div>
          )}
        </Card>

        {/* Product Cards Grid */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">All Products</h2>
              <p className="text-sm text-muted-foreground mt-1">Browse and manage your product catalog</p>
            </div>
          </div>
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12 bg-muted/50 rounded-lg border-2 border-dashed">
              <SlidersHorizontal className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-foreground font-medium">
                {searchQuery ? "No products match your search" : "No products yet"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {searchQuery ? "Try adjusting your search or filters." : "Add your first product to get started."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {paginatedProducts.map((product) => {
                const profit = product.sellingPrice - product.purchasePrice;
                return (
                  <Card key={product._id} className="overflow-hidden shadow-md hover:shadow-xl transition-all duration-300">
                    <CardContent className="pt-4">
                      <h3 className="font-semibold text-lg mb-2 truncate text-foreground">{product.name}</h3>
                      {product.category && (
                        <Badge variant="secondary" className="mb-3">
                          {product.category}
                        </Badge>
                      )}
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Cost Price:</span>
                          <span className="block font-semibold">₹{product.purchasePrice.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Selling Price:</span>
                          <span className="block font-semibold">₹{product.sellingPrice.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Stock Quantity:</span>
                          <span className="block">
                            {product.stock === 0 ? (
                              <Badge variant="destructive">Out of Stock</Badge>
                            ) : (
                              <span className="font-semibold">{product.stock} units</span>
                            )}
                          </span>
                        </div>
                        {product.stock <= 2 && product.stock > 0 && (
                          <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded p-2 text-yellow-800 dark:text-yellow-400 text-xs font-medium">
                            ⚠️ Low Stock
                          </div>
                        )}
                      </div>
                    </CardContent>
                    <div className="px-4 pb-4 pt-2 border-t bg-muted/30 flex gap-2">
                      <Link href={`/stock/product/${product._id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          View
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => openEditDialog(product)}
                      >
                        <Pencil className="w-3 h-3 mr-1" />
                        Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="flex-1 text-destructive hover:bg-destructive hover:text-destructive-foreground">
                            <Trash2 className="w-3 h-3 mr-1" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Product</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete &quot;{product.name}&quot;? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteProduct(product._id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </Card>
                  );
              })}
            </div>
          )}
          
          {/* Pagination */}
          {filteredProducts.length > itemsPerPage && (
            <div className="mt-8 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredProducts.length)} of {filteredProducts.length} products
              </p>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  
                  {[...Array(totalPages)].map((_, i) => {
                    const page = i + 1;
                    // Show first page, last page, current page, and pages around current
                    if (
                      page === 1 ||
                      page === totalPages ||
                      (page >= currentPage - 1 && page <= currentPage + 1)
                    ) {
                      return (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => setCurrentPage(page)}
                            isActive={currentPage === page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    } else if (page === currentPage - 2 || page === currentPage + 2) {
                      return (
                        <PaginationItem key={page}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }
                    return null;
                  })}
                  
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>

        {/* Edit Product Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Product</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUpdateProduct} className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Product Name *</Label>
                <Input
                  id="edit-name"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  placeholder="Enter product name"
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-category">Category</Label>
                <Input
                  id="edit-category"
                  value={editForm.category}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  placeholder="e.g., Sofa, Bed, Table"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-purchasePrice">Purchase Price</Label>
                  <Input
                    id="edit-purchasePrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={editForm.purchasePrice}
                    onChange={(e) => setEditForm({ ...editForm, purchasePrice: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-sellingPrice">Selling Price</Label>
                  <Input
                    id="edit-sellingPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={editForm.sellingPrice}
                    onChange={(e) => setEditForm({ ...editForm, sellingPrice: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-stock">Stock</Label>
                <Input
                  id="edit-stock"
                  type="number"
                  min="0"
                  value={editForm.stock}
                  onChange={(e) => setEditForm({ ...editForm, stock: e.target.value })}
                  placeholder="0"
                />
              </div>
              {error && <p className="text-destructive text-sm">{error}</p>}
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Update Product
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
