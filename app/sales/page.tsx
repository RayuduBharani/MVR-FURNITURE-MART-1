'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { searchProducts, createSale, getSales, makeAdditionalPayment } from '@/actions/sales-actions';
import jsPDF from 'jspdf';
import CustomerInfoForm from '@/components/sales/CustomerInfoForm';
import ProductSearch from '@/components/sales/ProductSearch';
import BillSummary from '@/components/sales/BillSummary';
import PendingBillsTable from '@/components/sales/PendingBillsTable';
import SalesListWithFilter from '@/components/sales/SalesListWithFilter';
import PaymentDialog from '@/components/sales/PaymentDialog';

interface CartItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
}

interface Product {
  id: string;
  name: string;
  sellingPrice: number;
  stock: number;
}

interface PaymentHistory {
  date: string;
  amount: number;
  paymentType: string;
}

interface Sale {
  id: string;
  date: string;
  customerName: string;
  paymentType: string;
  status: string;
  totalAmount: number;
  initialPayment: number;
  balanceAmount: number;
  serialNumber?: string;
  paymentHistory: PaymentHistory[];
  items: CartItem[];
}

export default function SalesPage() {
  const [activeTab, setActiveTab] = useState('create-bill');
  
  // Create Bill State
  const [customerName, setCustomerName] = useState('');
  const [phoneNumber1, setPhoneNumber1] = useState('');
  const [phoneNumber2, setPhoneNumber2] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentType, setPaymentType] = useState<'CASH' | 'UPI' | 'CARD' | 'OTHER'>('CASH');
  const [isPendingBill, setIsPendingBill] = useState(false);
  const [initialPayment, setInitialPayment] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [sellingPrice, setSellingPrice] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isCreatingBillRef = useRef(false);

  // View Sales State
  const [sales, setSales] = useState<Sale[]>([]);
  const [loadingSales, setLoadingSales] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [expandedSale, setExpandedSale] = useState<string | null>(null);
  
  // EMI Payment State
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedSaleForPayment, setSelectedSaleForPayment] = useState<Sale | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Search products
  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const result = await searchProducts(query);
        if (result.success && result.data) {
          // Convert API response format to Product interface
          const products = result.data.map((p) => ({
            id: p.id,
            name: p.name,
            stock: p.stock,
            sellingPrice: p.sellingPrice,
          }));
          setSearchResults(products);
        }
      } catch (err) {
        console.error('Search error:', err);
      }
    }, 300);
  }, []);

  // Add item to cart
  const handleAddToCart = useCallback(() => {
    if (!selectedProduct) {
      toast.error('Please select a product');
      return;
    }

    if (quantity < 1 || quantity > selectedProduct.stock) {
      toast.error(`Quantity must be between 1 and ${selectedProduct.stock}`);
      return;
    }

    if (sellingPrice <= 0) {
      toast.error('Selling price must be greater than 0');
      return;
    }

    const subtotal = quantity * sellingPrice;
    const newItem: CartItem = {
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      quantity,
      price: sellingPrice,
      subtotal,
    };

    // Check if product already in cart
    const existingIndex = cart.findIndex((item) => item.productId === selectedProduct.id);
    if (existingIndex >= 0) {
      const updatedCart = [...cart];
      updatedCart[existingIndex].quantity += quantity;
      updatedCart[existingIndex].subtotal += subtotal;
      setCart(updatedCart);
    } else {
      setCart([...cart, newItem]);
    }

    setSelectedProduct(null);
    setQuantity(1);
    setSellingPrice(0);
    setSearchQuery('');
    setSearchResults([]);
    setError('');
  }, [selectedProduct, quantity, sellingPrice, cart]);

  // Remove item from cart
  const handleRemoveFromCart = useCallback((productId: string) => {
    setCart((prevCart) => prevCart.filter((item) => item.productId !== productId));
  }, []);

  // Calculate total
  const totalAmount = cart.reduce((sum, item) => sum + item.subtotal, 0);

  // Create bill
  const handleCreateBill = async () => {
    // Prevent concurrent bill creation
    if (isCreatingBillRef.current || loading) {
      return;
    }
    
    // Allow empty customer name - it will default to "Walk-in"
    const finalCustomerName = customerName.trim() || "Walk-in";

    if (cart.length === 0) {
      toast.error('Cart is empty. Add items before creating bill');
      return;
    }

    if (!paymentType) {
      toast.error('Payment type is required');
      return;
    }

    // Validate initial payment if it's a pending bill
    if (isPendingBill) {
      if (!serialNumber || serialNumber.trim() === '') {
        toast.error('Serial number is required for pending bills');
        return;
      }
      const initialPaymentValue = parseFloat(initialPayment) || 0;
      if (initialPaymentValue < 0) {
        toast.error('Initial payment cannot be negative');
        return;
      }
      if (initialPaymentValue > totalAmount) {
        toast.error(`Initial payment (₹${initialPaymentValue.toFixed(2)}) cannot exceed total amount (₹${totalAmount.toFixed(2)})`);
        return;
      }
    }

    isCreatingBillRef.current = true;
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // If not pending bill, payment is full amount; otherwise use initial payment
      // Cap initial payment at total amount to prevent negative balance
      const paymentAmount = isPendingBill 
        ? Math.min(parseFloat(initialPayment) || 0, totalAmount)
        : totalAmount;

      const saleRequest = {
        customerName: finalCustomerName,
        paymentType,
        pendingBill: isPendingBill,
        initialPayment: paymentAmount,
        serialNumber: isPendingBill ? serialNumber : undefined,
        items: cart.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      };

      console.log('Creating sale with request:', saleRequest);
      console.log('Serial number value:', serialNumber, 'isPendingBill:', isPendingBill);

      const result = await createSale(saleRequest);

      console.log('Create sale result:', result);

      if (result.success && result.data) {
        const saleData = result.data as Sale;
        toast.success(`Bill created successfully! Invoice #${saleData.id.substring(saleData.id.length - 6)}`);
        
        // Determine where to navigate based on payment status
        const isPending = saleData.status === 'PENDING' || saleData.balanceAmount > 0;
        
        // Clear form first
        setCustomerName('');
        setPhoneNumber1('');
        setPhoneNumber2('');
        setAddress('');
        setNotes('');
        setPaymentType('CASH');
        setIsPendingBill(false);
        setInitialPayment('');
        setSerialNumber('');
        setCart([]);
        setQuantity(1);

        // Small delay to ensure UI updates, then generate PDF and navigate
        setTimeout(() => {
          try {
            console.log('Generating PDF for sale:', saleData);
            generateAndDownloadInvoice(saleData);
            
            // Reload sales
            fetchSales();
            
            // Navigate to appropriate tab
            setActiveTab('view-sales');
            setStatusFilter(isPending ? 'PENDING' : 'PAID');
          } catch (pdfError: unknown) {
            const errorMsg = pdfError instanceof Error ? pdfError.message : 'PDF generation error';
            console.error('PDF error:', errorMsg);
            toast.error(`PDF Error: ${errorMsg}`);
          }
        }, 500);
      } else {
        const errorMsg = result.error || 'Failed to create bill';
        toast.error(errorMsg);
        console.error('Bill creation failed:', errorMsg);
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      toast.error(errorMessage);
      console.error('Error creating bill:', errorMessage);
    } finally {
      setLoading(false);
      isCreatingBillRef.current = false;
    }
  };

  // Fetch sales
  const fetchSales = useCallback(async () => {
    setLoadingSales(true);
    try {
      const result = await getSales();
      if (result.success) {
        setSales(result.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch sales:', err);
    }
    setLoadingSales(false);
  }, []);

  // Handle EMI Payment
  const handleMakePayment = async () => {
    if (!selectedSaleForPayment || !paymentAmount) {
      toast.error('Please enter payment amount');
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (amount <= 0) {
      toast.error('Payment amount must be greater than 0');
      return;
    }

    if (amount > selectedSaleForPayment.balanceAmount) {
      toast.error(`Payment cannot exceed balance of ₹${selectedSaleForPayment.balanceAmount.toFixed(2)}`);
      return;
    }

    setPaymentLoading(true);

    try {
      const result = await makeAdditionalPayment(selectedSaleForPayment.id, amount);
      
      if (result.success) {
        toast.success(`Payment of ₹${amount.toFixed(2)} recorded successfully!`);
        setPaymentDialogOpen(false);
        setSelectedSaleForPayment(null);
        setPaymentAmount('');
        fetchSales(); // Refresh sales list
      } else {
        toast.error(result.error || 'Failed to record payment');
      }
    } catch (err) {
      toast.error('An error occurred while processing payment');
      console.error('Payment error:', err);
    } finally {
      setPaymentLoading(false);
    }
  };

  // Load from localStorage on mount (client-side only)
  useEffect(() => {
    const savedTab = localStorage.getItem('salesActiveTab');
    const savedFilter = localStorage.getItem('salesStatusFilter');
    if (savedTab) setActiveTab(savedTab);
    if (savedFilter) setStatusFilter(savedFilter);
  }, []);

  // Save activeTab to localStorage
  useEffect(() => {
    localStorage.setItem('salesActiveTab', activeTab);
  }, [activeTab]);

  // Save statusFilter to localStorage
  useEffect(() => {
    localStorage.setItem('salesStatusFilter', statusFilter);
  }, [statusFilter]);

  // Load sales on mount and when tab changes
  useEffect(() => {
    if (activeTab === 'view-sales') {
      fetchSales();
    }
  }, [activeTab, fetchSales]);

  // Clear success message after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Categorize sales
  const paidSales = sales.filter(sale => sale.status === 'PAID');
  const pendingSales = sales.filter(sale => sale.status === 'PENDING');

  // Filter based on selected category
  const getFilteredSales = () => {
    if (statusFilter === 'PAID') return paidSales;
    if (statusFilter === 'PENDING') return pendingSales;
    return sales; // ALL
  };

  const filteredSales = getFilteredSales();

  // Pagination calculations
  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSales = filteredSales.slice(startIndex, endIndex);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  // Generate and download invoice PDF
  const generateAndDownloadInvoice = useCallback((sale: Sale) => {
    try {
      if (!sale || !sale.id || !sale.items) {
        console.error('Invalid sale data:', sale);
        toast.error('Invalid sale data for PDF generation');
        return;
      }

      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPosition = 25;

      // Main Header - MVR FURNITURE MART
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('MVR FURNITURE MART', 20, yPosition);
      yPosition += 8;

      // Subheader
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Furniture Store & Supplies', 20, yPosition);
      yPosition += 4;
      pdf.text('Address: (Your address here)', 20, yPosition);
      yPosition += 4;
      pdf.text('Phone: (Your phone number)', 20, yPosition);
      yPosition += 4;
      pdf.text('Email: (Your email)', 20, yPosition);
      yPosition += 2;

      // Bill details on right side
      const saleDate = typeof sale.date === 'string' ? new Date(sale.date) : sale.date;
      const billNo = sale.id.substring(sale.id.length - 6); // Last 6 chars of ID
      
      pdf.setFontSize(10);
      pdf.text(`Bill No: ${billNo}`, pageWidth - 60, 25, { align: 'left' });
      pdf.text(`Date: ${saleDate.toLocaleDateString('en-GB')}`, pageWidth - 60, 31, { align: 'left' });
      pdf.text(`Customer: ${sale.customerName}`, pageWidth - 60, 37, { align: 'left' });
      pdf.text(`Payment: ${sale.paymentType} (${sale.status})`, pageWidth - 60, 43, { align: 'left' });

      // Horizontal line
      yPosition += 2;
      pdf.setLineWidth(0.5);
      pdf.line(20, yPosition, pageWidth - 20, yPosition);
      yPosition += 8;

      // Table Header with background
      pdf.setFillColor(240, 240, 240);
      pdf.rect(20, yPosition - 5, pageWidth - 40, 8, 'F');
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('#', 25, yPosition);
      pdf.text('Item', 40, yPosition);
      pdf.text('Qty', 120, yPosition, { align: 'center' });
      pdf.text('Price', 145, yPosition, { align: 'right' });
      pdf.text('Subtotal', pageWidth - 25, yPosition, { align: 'right' });
      yPosition += 8;

      // Items
      pdf.setFont('helvetica', 'normal');
      if (Array.isArray(sale.items)) {
        sale.items.forEach((item, index) => {
          if (yPosition > pageHeight - 50) {
            pdf.addPage();
            yPosition = 25;
          }

          pdf.setFontSize(9);
          const productName = item.productName || 'Unknown Product';
          
          pdf.text((index + 1).toString(), 25, yPosition);
          pdf.text(productName.substring(0, 35), 40, yPosition);
          pdf.text(item.quantity.toString(), 120, yPosition, { align: 'center' });
          pdf.text(`₹${item.price.toFixed(2)}`, 145, yPosition, { align: 'right' });
          pdf.text(`₹${item.subtotal.toFixed(2)}`, pageWidth - 25, yPosition, { align: 'right' });
          yPosition += 7;
        });
      }

      // Bottom line before total
      yPosition += 2;
      pdf.setLineWidth(0.5);
      pdf.line(20, yPosition, pageWidth - 20, yPosition);
      yPosition += 8;

      // Payment Details
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`Total Amount: ₹${sale.totalAmount.toFixed(2)}`, pageWidth - 25, yPosition, { align: 'right' });
      yPosition += 7;

      if (sale.initialPayment > 0) {
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Initial Payment: ₹${sale.initialPayment.toFixed(2)}`, pageWidth - 25, yPosition, { align: 'right' });
        yPosition += 6;
        
        if (sale.balanceAmount > 0) {
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(220, 38, 38); // Red color for balance
          pdf.text(`Balance Due: ₹${sale.balanceAmount.toFixed(2)}`, pageWidth - 25, yPosition, { align: 'right' });
          pdf.setTextColor(0, 0, 0); // Reset to black
          yPosition += 8;
        }
      }

      // Footer
      yPosition = pageHeight - 25;
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Thank you for your business! Please visit again.', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 4;
      pdf.text('This is a computer-generated invoice. No signature required.', pageWidth / 2, yPosition, { align: 'center' });

      pdf.save(`Invoice-${billNo}.pdf`);
      toast.success('Invoice downloaded successfully!');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate PDF';
      console.error('PDF generation error:', errorMessage);
      toast.error(`Failed to generate invoice: ${errorMessage}`);
    }
  }, []);

  return (
    <div className="min-h-screen bg-background p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground">Billing & Sales</h1>
          <p className="text-muted-foreground mt-2">Create and manage customer bills</p>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 border-green-500 bg-green-50 dark:bg-green-950/20">
            <AlertDescription className="text-green-800 dark:text-green-400">{success}</AlertDescription>
          </Alert>
        )}

        <div className="w-full">
          {/* Tabs */}
          <div className="flex gap-4 mb-6 border-b border-border">
            <button
              onClick={() => setActiveTab('create-bill')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'create-bill'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Create Bill
            </button>
            <button
              onClick={() => setActiveTab('view-sales')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'view-sales'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              View Sales
            </button>
          </div>

          {/* Create Bill Tab */}
          {activeTab === 'create-bill' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left - Product Selection */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Product Search */}
                <ProductSearch
                  searchQuery={searchQuery}
                  searchResults={searchResults}
                  selectedProduct={selectedProduct}
                  quantity={quantity}
                  sellingPrice={sellingPrice}
                  onSearchChange={handleSearch}
                  onSelectProduct={(product) => {
                    setSelectedProduct(product);
                    setSellingPrice(product.sellingPrice);
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                  onClearProduct={() => {
                    setSelectedProduct(null);
                    setSellingPrice(0);
                  }}
                  onQuantityChange={setQuantity}
                  onSellingPriceChange={setSellingPrice}
                  onAddToCart={handleAddToCart}
                />
                {/* Customer Info */}
                <CustomerInfoForm
                  customerName={customerName}
                  setCustomerName={setCustomerName}
                  phoneNumber1={phoneNumber1}
                  setPhoneNumber1={setPhoneNumber1}
                  phoneNumber2={phoneNumber2}
                  setPhoneNumber2={setPhoneNumber2}
                  address={address}
                  setAddress={setAddress}
                  notes={notes}
                  setNotes={setNotes}
                  paymentType={paymentType}
                  setPaymentType={setPaymentType}
                  initialPayment={initialPayment}
                  setInitialPayment={setInitialPayment}
                  isPendingBill={isPendingBill}
                  setIsPendingBill={setIsPendingBill}
                  serialNumber={serialNumber}
                  setSerialNumber={setSerialNumber}
                />
              </div>

              {/* Right - Cart Summary */}
              <div>
                <BillSummary
                  cart={cart}
                  totalAmount={totalAmount}
                  initialPayment={initialPayment}
                  isPendingBill={isPendingBill}
                  loading={loading}
                  onRemoveItem={handleRemoveFromCart}
                  onCreateBill={handleCreateBill}
                />
              </div>
            </div>
          )}

          {/* View Sales Tab */}
          {activeTab === 'view-sales' && (
            <div className="space-y-4">
              {/* Filter */}
              <div className="flex gap-2 flex-wrap">
                <Button
                  onClick={() => setStatusFilter('ALL')}
                  variant={statusFilter === 'ALL' ? 'default' : 'outline'}
                >
                  All ({sales.length})
                </Button>
                <Button
                  onClick={() => setStatusFilter('PAID')}
                  variant={statusFilter === 'PAID' ? 'default' : 'outline'}
                  className={statusFilter === 'PAID' ? 'bg-green-600 hover:bg-green-700' : ''}
                >
                  ✓ Paid ({paidSales.length})
                </Button>
                <Button
                  onClick={() => setStatusFilter('PENDING')}
                  variant={statusFilter === 'PENDING' ? 'default' : 'outline'}
                  className={statusFilter === 'PENDING' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
                >
                  ⏳ Pending ({pendingSales.length})
                </Button>
              </div>

              {/* Sales List */}
              {loadingSales ? (
                <div className="text-center py-8 text-muted-foreground">Loading sales...</div>
              ) : filteredSales.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No sales found</div>
              ) : (
                <>
                  {statusFilter === 'PENDING' ? (
                    <PendingBillsTable
                      sales={paginatedSales}
                      onPayEMI={(sale) => {
                        setSelectedSaleForPayment(sale);
                        setPaymentDialogOpen(true);
                      }}
                    />
                  ) : (
                    <SalesListWithFilter
                      sales={paginatedSales}
                      expandedSale={expandedSale}
                      onToggleExpand={(saleId) => setExpandedSale(expandedSale === saleId ? null : saleId)}
                      onPayEMI={(sale) => {
                        setSelectedSaleForPayment(sale);
                        setPaymentDialogOpen(true);
                      }}
                      onDownloadInvoice={generateAndDownloadInvoice}
                    />
                  )}

                  {/* Pagination */}
                  {filteredSales.length > itemsPerPage && (
                    <div className="mt-6 flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        Showing {startIndex + 1} to {Math.min(endIndex, filteredSales.length)} of {filteredSales.length} sales
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
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Payment Dialog */}
      <PaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        sale={selectedSaleForPayment}
        paymentAmount={paymentAmount}
        setPaymentAmount={setPaymentAmount}
        error={error}
        loading={paymentLoading}
        onConfirmPayment={handleMakePayment}
      />
    </div>
  );
}