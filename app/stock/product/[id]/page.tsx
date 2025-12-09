"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { jsPDF } from "jspdf";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Loader2,
  TrendingUp,
  Pencil,
  Trash2,
  Package,
  IndianRupee,
  BarChart3,
  User,
  Calendar,
  Download,
} from "lucide-react";
import {
  getProductById,
  updateProduct,
  deleteProduct,
  ProductData,
} from "@/actions/product-actions";
import {
  addPurchase,
  getPurchasesByProduct,
  markPurchaseAsPaid,
  PurchaseListItem,
} from "@/actions/purchase-actions";
import {
  addPayment,
  getPaymentsByProduct,
  PaymentData,
} from "@/actions/payment-actions";

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [product, setProduct] = useState<ProductData | null>(null);
  const [purchases, setPurchases] = useState<PurchaseListItem[]>([]);
  const [payments, setPayments] = useState<PaymentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Dialog states
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isStockInOpen, setIsStockInOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [selectedPurchaseId, setSelectedPurchaseId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: "",
    category: "",
    purchasePrice: "",
    sellingPrice: "",
    stock: "",
    supplierName: "",
  });

  // Stock in form state
  const [stockInForm, setStockInForm] = useState({
    quantity: "",
    pricePerUnit: "",
    supplierName: "",
    isPending: false,
    initialPayment: "",
  });

  // Payment form state
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    paymentMethod: "",
    notes: "",
  });

  // Load product data
  useEffect(() => {
    loadProduct();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function loadProduct() {
    setLoading(true);
    setError("");
    try {
      const [productRes, purchasesRes, paymentsRes] = await Promise.all([
        getProductById(id),
        getPurchasesByProduct(id),
        getPaymentsByProduct(id),
      ]);

      if (productRes.success && productRes.data) {
        setProduct(productRes.data);
        setEditForm({
          name: productRes.data.name,
          category: productRes.data.category || "",
          purchasePrice: productRes.data.purchasePrice.toString(),
          sellingPrice: productRes.data.sellingPrice.toString(),
          stock: productRes.data.stock.toString(),
          supplierName: productRes.data.supplierName || "",
        });
        setStockInForm((prev) => ({
          ...prev,
          pricePerUnit: productRes.data!.purchasePrice.toString(),
          supplierName: productRes.data!.supplierName || "",
        }));
      } else {
        setError(productRes.error || "Product not found");
      }

      if (purchasesRes.success && purchasesRes.data) {
        setPurchases(purchasesRes.data);
      }

      if (paymentsRes.success && paymentsRes.data) {
        setPayments(paymentsRes.data);
      }
    } catch {
      setError("Failed to load product");
    } finally {
      setLoading(false);
    }
  }

  // Handle edit product
  async function handleUpdateProduct(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const result = await updateProduct(id, {
        name: editForm.name,
        category: editForm.category,
        purchasePrice: parseFloat(editForm.purchasePrice) || 0,
        sellingPrice: parseFloat(editForm.sellingPrice) || 0,
        stock: parseInt(editForm.stock) || 0,
        supplierName: editForm.supplierName,
      });

      if (result.success) {
        setIsEditOpen(false);
        loadProduct();
      } else {
        setError(result.error || "Failed to update product");
      }
    } catch {
      setError("Failed to update product");
    } finally {
      setSubmitting(false);
    }
  }

  // Handle stock in
  async function handleStockIn(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const result = await addPurchase({
        productId: id,
        quantity: parseInt(stockInForm.quantity),
        pricePerUnit: parseFloat(stockInForm.pricePerUnit),
        supplierName: stockInForm.supplierName,
        isPending: stockInForm.isPending,
        initialPayment: stockInForm.isPending ? (parseFloat(stockInForm.initialPayment) || 0) : 0,
      });

      if (result.success) {
        setIsStockInOpen(false);
        setStockInForm({
          quantity: "",
          pricePerUnit: product?.purchasePrice.toString() || "",
          supplierName: product?.supplierName || "",
          isPending: false,
          initialPayment: "",
        });
        loadProduct();
      } else {
        setError(result.error || "Failed to add stock");
      }
    } catch {
      setError("Failed to add stock");
    } finally {
      setSubmitting(false);
    }
  }

  // Handle delete product
  async function handleDeleteProduct() {
    setSubmitting(true);
    try {
      const result = await deleteProduct(id);
      if (result.success) {
        router.push("/stock");
      } else {
        setError(result.error || "Failed to delete product");
      }
    } catch {
      setError("Failed to delete product");
    } finally {
      setSubmitting(false);
      setIsDeleteOpen(false);
    }
  }

  // Handle mark as paid
  async function handleMarkAsPaid(purchaseId: string) {
    try {
      const result = await markPurchaseAsPaid(purchaseId);
      if (result.success) {
        loadProduct();
      }
    } catch {
      console.error("Failed to mark as paid");
    }
  }

  // Handle add payment
  async function handleAddPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPurchaseId) {
      setError("No purchase selected");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const result = await addPayment({
        purchaseId: selectedPurchaseId,
        amount: parseFloat(paymentForm.amount) || 0,
        paymentMethod: paymentForm.paymentMethod,
        notes: paymentForm.notes,
      });

      if (result.success) {
        setPaymentForm({ amount: "", paymentMethod: "", notes: "" });
        setSelectedPurchaseId(null);
        setIsPaymentOpen(false);
        loadProduct();
      } else {
        setError(result.error || "Failed to add payment");
      }
    } catch {
      setError("Failed to add payment");
    } finally {
      setSubmitting(false);
    }
  }

// Handle download payment transaction as PDF
function handleDownloadPayment(payment: PaymentData, productName: string) {
  // Find the matching purchase for this payment
  const purchase = purchases.find(p => p.id === payment.purchaseId);
  const supplierName = purchase?.supplierName || '-';
  const quantity = purchase?.quantity ?? '-';
  const remainingAmount = purchase ? (purchase.total - purchase.paidAmount) : '-';

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const leftMargin = 15;
  const rightMargin = 15;
  let yPos = 15;

  // ===== HEADER SECTION =====
  // Company Details - Left Side
  doc.setFontSize(16);
  doc.setFont('courier', 'bold');
  doc.text('MVR FURNITURE MART', leftMargin, yPos);

  yPos += 8;
  doc.setFontSize(10);
  doc.setFont('courier', 'normal');
  doc.text('Furniture Store & Supplies', leftMargin, yPos);

  yPos += 5;
  doc.setFontSize(9);
  doc.text('Address: Kakinda, Andhra Pradesh', leftMargin, yPos);

  yPos += 4;
  doc.text('Phone: +91 9876543210', leftMargin, yPos);

  // Receipt Details - Right Side
  const rightStartX = pageWidth - rightMargin - 70;
  yPos = 15;

  doc.setFontSize(10);
  doc.setFont('courier', 'bold');
  doc.text('Transaction ID:', rightStartX, yPos);
  
  doc.setFont('courier', 'normal');
  const transactionIdText = doc.splitTextToSize(payment.id.toString(), 40);
  doc.text(transactionIdText, rightStartX + 35, yPos);
  if (transactionIdText.length > 1) {
    yPos += (transactionIdText.length - 1) * 5;
  }

  yPos += 7;
  doc.setFont('courier', 'bold');
  doc.text('Date:', rightStartX, yPos);
  
  doc.setFont('courier', 'normal');
  const dateStr = new Date(payment.paymentDate).toLocaleDateString('en-IN');
  doc.text(dateStr, rightStartX + 35, yPos);

  yPos += 7;
  doc.setFont('courier', 'bold');
  doc.text('Product:', rightStartX, yPos);
  
  doc.setFont('courier', 'normal');
  const maxWidth = 35;
  const splitProductName = doc.splitTextToSize(productName, maxWidth);
  doc.text(splitProductName, rightStartX + 35, yPos);
  
  if (splitProductName.length > 1) {
    yPos += (splitProductName.length - 1) * 5;
  }

  yPos += 7;
  doc.setFont('courier', 'bold');
  doc.text('Method:', rightStartX, yPos);
  
  doc.setFont('courier', 'normal');
  doc.text(payment.paymentMethod || 'Not specified', rightStartX + 35, yPos);

  // Separator line
  yPos = 50;
  doc.setLineWidth(1);
  doc.line(leftMargin, yPos, pageWidth - rightMargin, yPos);

  // ===== AMOUNT SECTION =====
  yPos += 12;
  doc.setFontSize(10);
  doc.setFont('courier', 'bold');
  doc.text('AMOUNT PAID:', leftMargin + 5, yPos);
  
  // Format amount without rupee symbol first, then add it separately
  const amountText = 'Rs. ' + payment.amount.toLocaleString('en-IN', { 
    minimumFractionDigits: 2, 
    maximumFractionDigits: 2 
  });
  doc.text(amountText, leftMargin + 5 + 50, yPos - 25); // Adjusted yPos for correct placement

  // ===== SUPPLIER, COUNT, REMAINING SECTION =====
  yPos += 10;
  doc.setFontSize(10);
  doc.setFont('courier', 'bold');
  doc.text('SUPPLIER:', leftMargin + 5, yPos);
  doc.setFont('courier', 'normal');
  doc.text(supplierName, leftMargin + 60, yPos);

  yPos += 7;
  doc.setFont('courier', 'bold');
  doc.text('COUNT:', leftMargin + 5, yPos);
  doc.setFont('courier', 'normal');
  doc.text(quantity.toString(), leftMargin + 60, yPos);

  yPos += 7;
  doc.setFont('courier', 'bold');
  doc.text('REMAINING:', leftMargin + 5, yPos);
  doc.setFont('courier', 'normal');
  
  let remainingText = '-';
  if (typeof remainingAmount === 'number') {
    const formattedRemaining = remainingAmount.toLocaleString('en-IN', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    });
    remainingText = 'Rs. ' + formattedRemaining;
  }
  doc.text(remainingText, leftMargin + 60, yPos);

  yPos += 7;
  doc.setFont('courier', 'bold');
  doc.text('TOTAL AMOUNT:', leftMargin + 5, yPos);
  doc.setFont('courier', 'normal');
  doc.text(
    purchase && typeof purchase.total === 'number'
      ? 'Rs. ' + purchase.total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : '-',
    leftMargin + 60,
    yPos
  );

  yPos += 8;
  doc.setLineWidth(1);
  doc.line(leftMargin, yPos, pageWidth - rightMargin, yPos);

  // ===== NOTES SECTION =====
  yPos += 10;
  doc.setFontSize(10);
  doc.setFont('courier', 'bold');
  doc.text('NOTES:', leftMargin + 5, yPos);

  yPos += 8;
  doc.setFontSize(9);
  doc.setFont('courier', 'normal');
  const notesText = payment.notes || 'No additional notes';
  const wrappedNotes = doc.splitTextToSize(notesText, 160);
  doc.text(wrappedNotes, leftMargin + 5, yPos);

  yPos += wrappedNotes.length * 5 + 10;

  // Separator line
  doc.setLineWidth(0.5);
  doc.line(leftMargin, yPos, pageWidth - rightMargin, yPos);

  // ===== FOOTER =====
  yPos = pageHeight - 20;
  doc.setFontSize(9);
  doc.setFont('courier', 'normal');
  doc.text('Thank you for your payment!', pageWidth / 2, yPos, { align: 'center' });

  yPos += 5;
  doc.setFontSize(8);
  doc.text('This is a computer-generated receipt. No signature required.', pageWidth / 2, yPos, { align: 'center' });

  // Save PDF
  const fileName = `Payment_Receipt_${productName.replace(/\s+/g, '_')}_${dateStr.replace(/\//g, '-')}.pdf`;
  doc.save(fileName);
}

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error && !product) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Link href="/stock">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Stock
              </Button>
            </Link>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-destructive">{error}</p>
              <Link href="/stock">
                <Button className="mt-4">Go Back</Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (!product) return null;

  const profitMargin = product.sellingPrice - product.purchasePrice;
  const profitPercentage =
    product.purchasePrice > 0
      ? ((profitMargin / product.purchasePrice) * 100).toFixed(1)
      : "0";
  const stockValue = product.stock * product.purchasePrice;
  const potentialRevenue = product.stock * product.sellingPrice;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/stock">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {product.name}
                </h1>
                <p className="text-muted-foreground">
                  {product.category || "Uncategorized"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setIsEditOpen(true)}>
                <Pencil className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button onClick={() => setIsStockInOpen(true)}>
                <TrendingUp className="w-4 h-4 mr-2" />
                Stock In
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Package className="w-4 h-4" />
                Current Stock
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold">{product.stock}</span>
                <Badge variant={product.stock > 0 ? "default" : "destructive"}>
                  {product.stock > 0 ? "In Stock" : "Out of Stock"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <IndianRupee className="w-4 h-4" />
                Purchase Price
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-3xl font-bold">
                ₹{product.purchasePrice.toFixed(2)}
              </span>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <IndianRupee className="w-4 h-4" />
                Selling Price
              </CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-3xl font-bold">
                ₹{product.sellingPrice.toFixed(2)}
              </span>
            </CardContent>
          </Card>
        </div>

        {/* Product Details & Financial Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Product Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-muted-foreground">Product Name</span>
                <span className="font-medium">{product.name}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-muted-foreground">Category</span>
                <span className="font-medium">{product.category || "-"}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-muted-foreground flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Supplier
                </span>
                <span className="font-medium">
                  {product.supplierName || "-"}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Created
                </span>
                <span className="font-medium">
                  {new Date(product.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-muted-foreground flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Last Updated
                </span>
                <span className="font-medium">
                  {new Date(product.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Financial Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-muted-foreground">Stock Value (Cost)</span>
                <span className="font-medium">₹{stockValue.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-muted-foreground">Potential Revenue</span>
                <span className="font-medium">
                  ₹{potentialRevenue.toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-muted-foreground">Potential Profit</span>
                <span className="font-medium text-green-600">
                  ₹{(potentialRevenue - stockValue).toFixed(2)}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-muted-foreground">Total Purchases</span>
                <span className="font-medium">{purchases.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Purchase History & Payment Tracking */}
        <div className="space-y-8">
          {/* Purchases */}
          <Card>
            <CardHeader>
              <CardTitle>Purchase History</CardTitle>
            </CardHeader>
            <CardContent>
              {purchases.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No purchase history for this product
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Price/Unit</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Paid</TableHead>
                      <TableHead className="text-right">Pending</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchases.map((purchase) => (
                      <TableRow key={purchase.id}>
                        <TableCell>
                          {new Date(purchase.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {purchase.quantity}
                        </TableCell>
                        <TableCell className="text-right">
                          ₹{purchase.pricePerUnit.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">
                          ₹{purchase.total.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right text-green-600">
                          ₹{purchase.paidAmount.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right text-destructive">
                          {purchase.pendingAmount > 0 ? `₹${purchase.pendingAmount.toFixed(2)}` : "-"}
                        </TableCell>
                        <TableCell>{purchase.supplierName || "-"}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              purchase.status === "PAID" ? "default" : "destructive"
                            }
                          >
                            {purchase.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {purchase.pendingAmount > 0 && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedPurchaseId(purchase.id);
                                setIsPaymentOpen(true);
                              }}
                            >
                              Add Payment
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Payment EMI Wise */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Transactions (EMI-wise)</CardTitle>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No payment transactions recorded
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          {new Date(payment.paymentDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right font-medium text-green-600">
                          ₹{payment.amount.toFixed(2)}
                        </TableCell>
                        <TableCell>{payment.paymentMethod || "-"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                          {payment.notes || "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="gap-1"
                            onClick={() => handleDownloadPayment(payment, product?.name || "Product")}
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Edit Product Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateProduct} className="space-y-4">
            <div>
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
                placeholder="Enter product name"
                required
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={editForm.category}
                onChange={(e) =>
                  setEditForm({ ...editForm, category: e.target.value })
                }
                placeholder="Enter category"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="purchasePrice">Purchase Price</Label>
                <Input
                  id="purchasePrice"
                  type="text"
                  value={editForm.purchasePrice}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || /^\d*\.?\d*$/.test(value)) {
                      setEditForm({ ...editForm, purchasePrice: value });
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
                  value={editForm.sellingPrice}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || /^\d*\.?\d*$/.test(value)) {
                      setEditForm({ ...editForm, sellingPrice: value });
                    }
                  }}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="stock">Stock</Label>
              <Input
                id="stock"
                type="text"
                value={editForm.stock}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || /^\d+$/.test(value)) {
                    setEditForm({ ...editForm, stock: value });
                  }
                }}
                placeholder="0"
              />
            </div>
            <div>
              <Label htmlFor="supplierName">Supplier Name</Label>
              <Input
                id="supplierName"
                value={editForm.supplierName}
                onChange={(e) =>
                  setEditForm({ ...editForm, supplierName: e.target.value })
                }
                placeholder="Enter supplier name"
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

      {/* Stock In Dialog */}
      <Dialog open={isStockInOpen} onOpenChange={setIsStockInOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Stock</DialogTitle>
          </DialogHeader>
          <div className="p-3 bg-secondary rounded-lg mb-4">
            <p className="text-sm text-muted-foreground">Product</p>
            <p className="text-lg font-semibold">{product.name}</p>
          </div>
          <form onSubmit={handleStockIn} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  type="text"
                  value={stockInForm.quantity}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || /^\d+$/.test(value)) {
                      setStockInForm({ ...stockInForm, quantity: value });
                    }
                  }}
                  placeholder="0"
                  required
                />
              </div>
              <div>
                <Label htmlFor="pricePerUnit">Price Per Unit *</Label>
                <Input
                  id="pricePerUnit"
                  type="text"
                  value={stockInForm.pricePerUnit}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || /^\d*\.?\d*$/.test(value)) {
                      setStockInForm({
                        ...stockInForm,
                        pricePerUnit: value,
                      });
                    }
                  }}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="supplierNameStock">Supplier Name</Label>
              <Input
                id="supplierNameStock"
                value={stockInForm.supplierName}
                onChange={(e) =>
                  setStockInForm({
                    ...stockInForm,
                    supplierName: e.target.value,
                  })
                }
                placeholder="Enter supplier name"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isPending"
                checked={stockInForm.isPending}
                onCheckedChange={(checked) =>
                  setStockInForm({
                    ...stockInForm,
                    isPending: checked as boolean,
                    initialPayment: checked ? stockInForm.initialPayment : "",
                  })
                }
              />
              <Label htmlFor="isPending" className="text-sm font-normal">
                Pending Bill (Payment not made yet)
              </Label>
            </div>
            {stockInForm.isPending && (
              <div>
                <Label htmlFor="initialPayment">Initial Payment</Label>
                <Input
                  id="initialPayment"
                  type="text"
                  value={stockInForm.initialPayment}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || /^\d*\.?\d*$/.test(value)) {
                      setStockInForm({
                        ...stockInForm,
                        initialPayment: value,
                      });
                    }
                  }}
                  placeholder="0.00"
                />
              </div>
            )}
            {stockInForm.quantity && stockInForm.pricePerUnit && (
              <div className="p-3 bg-secondary rounded-lg space-y-2">
                <div className="flex justify-between">
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="text-lg font-bold text-foreground">
                    ₹{(parseFloat(stockInForm.quantity) * parseFloat(stockInForm.pricePerUnit)).toFixed(2)}
                  </p>
                </div>
                {stockInForm.isPending && (
                  <>
                    <div className="flex justify-between">
                      <p className="text-sm text-muted-foreground">Initial Payment</p>
                      <p className="text-sm font-medium text-green-600">
                        ₹{(parseFloat(stockInForm.initialPayment) || 0).toFixed(2)}
                      </p>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <p className="text-sm text-muted-foreground">Pending Amount</p>
                      <p className="text-lg font-bold text-destructive">
                        ₹{((parseFloat(stockInForm.quantity) * parseFloat(stockInForm.pricePerUnit)) - (parseFloat(stockInForm.initialPayment) || 0)).toFixed(2)}
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}
            {error && <p className="text-destructive text-sm">{error}</p>}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Add Stock
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{product.name}&quot;? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProduct}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Payment Dialog */}
      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Payment</DialogTitle>
          </DialogHeader>
          {selectedPurchaseId && (
            <>
              <div className="p-3 bg-secondary rounded-lg mb-4">
                <p className="text-sm text-muted-foreground">Purchase</p>
                <p className="text-lg font-semibold">
                  {purchases.find((p) => p.id === selectedPurchaseId)?.productName ||
                    "Unknown"}
                </p>
                <div className="text-sm text-muted-foreground mt-2">
                  <div className="flex justify-between">
                    <span>Total Amount:</span>
                    <span className="font-medium text-foreground">
                      ₹
                      {(purchases.find((p) => p.id === selectedPurchaseId)
                        ?.total || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Remaining Balance:</span>
                    <span className="font-medium text-destructive">
                      ₹
                      {(purchases.find((p) => p.id === selectedPurchaseId)
                        ?.pendingAmount || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
              <form onSubmit={handleAddPayment} className="space-y-4">
                <div>
                  <Label htmlFor="amount">Payment Amount *</Label>
                  <Input
                    id="amount"
                    type="text"
                    value={paymentForm.amount}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || /^\d*\.?\d*$/.test(value)) {
                        setPaymentForm({ ...paymentForm, amount: value });
                      }
                    }}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <Input
                    id="paymentMethod"
                    value={paymentForm.paymentMethod}
                    onChange={(e) =>
                      setPaymentForm({
                        ...paymentForm,
                        paymentMethod: e.target.value,
                      })
                    }
                    placeholder="e.g., Bank Transfer, Cash, Cheque"
                  />
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    value={paymentForm.notes}
                    onChange={(e) =>
                      setPaymentForm({ ...paymentForm, notes: e.target.value })
                    }
                    placeholder="Optional notes about this payment"
                  />
                </div>
                {error && <p className="text-destructive text-sm">{error}</p>}
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  Add Payment
                </Button>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
