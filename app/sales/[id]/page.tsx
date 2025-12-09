'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';    
import { getSaleById, makeAdditionalPayment } from '@/actions/sales-actions';
import jsPDF from 'jspdf';
import MakePaymentDialog from '@/components/sales/MakePaymentDialog';

interface CartItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
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

export default function SaleDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const saleId = params.id as string;

  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Payment Dialog State
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentType, setPaymentType] = useState<'CASH' | 'UPI' | 'CARD' | 'OTHER'>('CASH');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState('');

  const fetchSale = useCallback(async () => {
    if (!saleId) return;
    
    setLoading(true);
    try {
      const result = await getSaleById(saleId);
      if (result.success && result.data) {
        setSale(result.data);
      } else {
        setError(result.error || 'Failed to load sale details');
      }
    } catch (err) {
      console.error('Failed to fetch sale:', err);
      setError('Failed to load sale details');
    }
    setLoading(false);
  }, [saleId]);

  useEffect(() => {
    fetchSale();
  }, [fetchSale]);

  const handleMakePayment = async () => {
    if (!sale) return;

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (amount > sale.balanceAmount) {
      toast.error(`Payment cannot exceed balance of ₹${sale.balanceAmount.toFixed(2)}`);
      return;
    }

    setPaymentLoading(true);

    try {
      const result = await makeAdditionalPayment(sale.id, amount, paymentType);
      
      if (result.success) {
        // Check if this payment completes the balance
        const willBePaid = sale.balanceAmount - amount <= 0;
        
        toast.success(
          willBePaid 
            ? `Payment of ₹${amount.toFixed(2)} recorded successfully! Sale is now fully paid.`
            : `Payment of ₹${amount.toFixed(2)} via ${paymentType} recorded successfully!`
        );
        setPaymentDialogOpen(false);
        setPaymentAmount('');
        setPaymentType('CASH');
        fetchSale(); // Refresh sale data
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

  const generateAndDownloadInvoice = useCallback(() => {
  if (!sale) return;

  try {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const leftMargin = 15;
    const rightMargin = 15;

    // ===== HEADER SECTION =====
    let yPos = 15;

    // Left side - Company details
    pdf.setFontSize(16);
    pdf.setFont('courier', 'bold');
    pdf.text('MVR FURNITURE MART', leftMargin, yPos);

    yPos += 8;
    pdf.setFontSize(10);
    pdf.setFont('courier', 'normal');
    pdf.text('Furniture Store & Supplies', leftMargin, yPos);

    yPos += 5;
    pdf.setFontSize(9);
    pdf.text('Address: Kakinda, Andhra Pradesh', leftMargin, yPos);

    yPos += 4;
    pdf.text('Phone: +91 9876543210', leftMargin, yPos);


    // Right side - Bill details
    const rightStartX = pageWidth - rightMargin - 60;
    yPos = 15;

    pdf.setFontSize(10);
    pdf.setFont('courier', 'bold');
    pdf.text('Bill No:', rightStartX, yPos);
    
    pdf.setFont('courier', 'normal');
    const billNo = sale.serialNumber || sale.id.substring(0, 9);
    pdf.text(billNo, rightStartX + 18, yPos);

    yPos += 7;
    pdf.setFont('courier', 'bold');
    pdf.text('Date:', rightStartX, yPos);
    
    pdf.setFont('courier', 'normal');
    const dateStr = new Date(sale.date).toLocaleDateString('en-IN');
    pdf.text(dateStr, rightStartX + 18, yPos);

    yPos += 7;
    pdf.setFont('courier', 'bold');
    pdf.text('Customer:', rightStartX, yPos);
    
    pdf.setFont('courier', 'normal');
    const maxWidth = 45;
    const splitCustomerName = pdf.splitTextToSize(sale.customerName, maxWidth);
    pdf.text(splitCustomerName, rightStartX + 18, yPos);
    
    // Adjust yPos based on number of lines
    if (splitCustomerName.length > 1) {
      yPos += (splitCustomerName.length - 1) * 5;
    }

    yPos += 7;
    pdf.setFont('courier', 'bold');
    pdf.text('Payment:', rightStartX, yPos);
    
    pdf.setFont('courier', 'normal');
    pdf.text(sale.paymentType, rightStartX + 18, yPos);

    // Separator line
    yPos = 50;
    pdf.setLineWidth(1);
    pdf.line(leftMargin, yPos, pageWidth - rightMargin, yPos);

    // ===== TABLE SECTION =====
    yPos += 10;

    // Table Headers
    pdf.setFontSize(10);
    pdf.setFont('courier', 'bold');
    
    pdf.text('#', leftMargin, yPos);
    pdf.text('Item', leftMargin + 8, yPos);
    pdf.text('Qty', 95, yPos);
    pdf.text('Price', 115, yPos);
    pdf.text('Subtotal', pageWidth - rightMargin - 20, yPos, { align: 'right' });

    yPos += 6;
    pdf.setLineWidth(1);
    pdf.line(leftMargin, yPos, pageWidth - rightMargin, yPos);

    // Table Rows
    yPos += 8;
    pdf.setFont('courier', 'normal');
    pdf.setFontSize(10);
    
    sale.items.forEach((item, idx) => {
      // Split long product names into multiple lines
      const maxWidth = 60;
      const itemNameLines = pdf.splitTextToSize(item.productName, maxWidth);
      
      pdf.text((idx + 1).toString(), leftMargin, yPos);
      pdf.text(itemNameLines, leftMargin + 8, yPos);
      
      // Right-align quantity in its column
      pdf.text(item.quantity.toString(), 105, yPos, { align: 'right' });
      
      // Right-align price in its column
      pdf.text(item.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), 145, yPos, { align: 'right' });
      
      // Right-align subtotal
      pdf.text(item.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), pageWidth - rightMargin, yPos, { align: 'right' });
      
      // Adjust yPos based on number of lines in item name
      yPos += Math.max(8, itemNameLines.length * 5 + 3);
    });

    // Bottom line
    pdf.setLineWidth(1);
    pdf.line(leftMargin, yPos, pageWidth - rightMargin, yPos);

    yPos += 10;

    // Summary section
    pdf.setFont('courier', 'bold');
    pdf.setFontSize(11);
    
    const summaryLabelX = 110;
    const summaryValueX = pageWidth - rightMargin - 20;

    pdf.text('Total:', summaryLabelX, yPos);
    pdf.text(sale.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), summaryValueX, yPos, { align: 'right' });

    if (sale.initialPayment > 0) {
      yPos += 8;
      pdf.text('Amount Paid:', summaryLabelX, yPos);
      pdf.text(sale.initialPayment.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), summaryValueX, yPos, { align: 'right' });

      if (sale.balanceAmount > 0) {
        yPos += 8;
        pdf.setTextColor(200, 0, 0);
        pdf.text('Balance Due:', summaryLabelX, yPos);
        pdf.text(sale.balanceAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), summaryValueX, yPos, { align: 'right' });
        pdf.setTextColor(0, 0, 0);
      }
    }

    // Footer
    yPos = pageHeight - 25;
    pdf.setFontSize(9);
    pdf.setFont('courier', 'normal');
    pdf.text('Thank you for your business! Please visit again.', pageWidth / 2, yPos, { align: 'center' });

    yPos += 5;
    pdf.setFontSize(8);
    pdf.text('This is a computer-generated invoice. No signature required.', pageWidth / 2, yPos, { align: 'center' });

    const fileName = `Invoice_${sale.customerName.replace(/\s+/g, '_')}_${new Date(sale.date).toLocaleDateString().replace(/\//g, '-')}.pdf`;
    pdf.save(fileName);
    
    toast.success('Invoice downloaded successfully!');
  } catch (err) {
    console.error('Error generating PDF:', err);
    toast.error('Failed to generate invoice');
  }
}, [sale]);

const generatePaymentReceipt = useCallback((payment: PaymentHistory, paymentIndex: number) => {
  if (!sale) return;

  try {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const leftMargin = 15;
    const rightMargin = 15;
    const centerX = pageWidth / 2;

    let yPos = 15;

    // ===== HEADER SECTION =====
    pdf.setFontSize(18);
    pdf.setFont('courier', 'bold');
    pdf.text('MVR FURNITURE MART', centerX, yPos, { align: 'center' });

    yPos += 8;
    pdf.setFontSize(10);
    pdf.setFont('courier', 'normal');
    pdf.text('Furniture Store & Supplies', centerX, yPos, { align: 'center' });

    yPos += 5;
    pdf.setFontSize(9);
    pdf.text('Kakinda, Andhra Pradesh | +91 9876543210', centerX, yPos, { align: 'center' });

    yPos += 10;
    pdf.setLineWidth(1);
    pdf.line(leftMargin, yPos, pageWidth - rightMargin, yPos);

    // ===== TITLE SECTION =====
    yPos += 8;
    pdf.setFontSize(14);
    pdf.setFont('courier', 'bold');
    pdf.text('PAYMENT RECEIPT', centerX, yPos, { align: 'center' });

    yPos += 10;
    pdf.setLineWidth(0.5);
    pdf.line(leftMargin, yPos, pageWidth - rightMargin, yPos);

    // ===== RECEIPT DETAILS SECTION =====
    yPos += 10;
    pdf.setFontSize(10);
    pdf.setFont('courier', 'bold');

    const labelX = leftMargin + 5;
    const valueX = pageWidth - rightMargin - 60;

    pdf.text('Receipt #:', labelX, yPos);
    pdf.setFont('courier', 'normal');
    pdf.text(`${sale.id}-${paymentIndex + 1}`, valueX, yPos);

    yPos += 7;
    pdf.setFont('courier', 'bold');
    pdf.text('Date:', labelX, yPos);
    pdf.setFont('courier', 'normal');
    pdf.text(new Date(payment.date).toLocaleDateString('en-IN'), valueX, yPos);

    yPos += 7;
    pdf.setFont('courier', 'bold');
    pdf.text('Customer:', labelX, yPos);
    pdf.setFont('courier', 'normal');
    const maxWidth = 50;
    const splitCustomerName = pdf.splitTextToSize(sale.customerName, maxWidth);
    pdf.text(splitCustomerName, valueX, yPos);
    if (splitCustomerName.length > 1) {
      yPos += (splitCustomerName.length - 1) * 5;
    }

    yPos += 7;
    pdf.setFont('courier', 'bold');
    pdf.text('Payment Method:', labelX, yPos);
    pdf.setFont('courier', 'normal');
    pdf.text(payment.paymentType, valueX, yPos);

    yPos += 7;
    pdf.setFont('courier', 'bold');
    pdf.text('Installment:', labelX, yPos);
    pdf.setFont('courier', 'normal');
    pdf.text(`#${paymentIndex + 1} of ${sale.paymentHistory.length}`, valueX, yPos);

    // ===== AMOUNT PAID BOX =====
    yPos += 12;
    pdf.setLineWidth(1);
    pdf.line(leftMargin, yPos, pageWidth - rightMargin, yPos);

    yPos += 8;
    pdf.setFontSize(10);
    pdf.setFont('courier', 'bold');
    pdf.text('AMOUNT PAID:', leftMargin + 5, yPos);
    
    const amountText = '₹ ' + payment.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    pdf.text(amountText, pageWidth / 2 + 50, yPos, { align: 'right' });

    yPos += 8;
    pdf.setLineWidth(1);
    pdf.line(leftMargin, yPos, pageWidth - rightMargin, yPos);

    // ===== SALE SUMMARY SECTION =====
    yPos += 10;
    pdf.setFontSize(10);
    pdf.setFont('courier', 'bold');
    pdf.text('SALE SUMMARY', leftMargin + 5, yPos);

    yPos += 8;
    pdf.setFontSize(9);
    pdf.setFont('courier', 'normal');

    const summaryLabelX = leftMargin + 10;
    const summaryValueX = pageWidth - rightMargin - 5;

    pdf.setFont('courier', 'bold');
    pdf.text('Total Sale Amount:', summaryLabelX, yPos);
    pdf.setFont('courier', 'normal');
    pdf.text(sale.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), summaryValueX, yPos, { align: 'right' });

    yPos += 7;
    pdf.setFont('courier', 'bold');
    pdf.text('Total Paid to Date:', summaryLabelX, yPos);
    pdf.setFont('courier', 'normal');
    pdf.setTextColor(0, 100, 0);
    pdf.text(sale.initialPayment.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), summaryValueX, yPos, { align: 'right' });
    pdf.setTextColor(0, 0, 0);

    yPos += 7;
    pdf.setFont('courier', 'bold');
    pdf.text('Balance Remaining:', summaryLabelX, yPos);
    pdf.setFont('courier', 'normal');
    if (sale.balanceAmount > 0) {
      pdf.setTextColor(200, 0, 0);
    } else {
      pdf.setTextColor(0, 100, 0);
    }
    pdf.text(sale.balanceAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }), summaryValueX, yPos, { align: 'right' });
    pdf.setTextColor(0, 0, 0);

    // ===== PAYMENT HISTORY SECTION =====
    if (sale.paymentHistory.length > 1) {
      yPos += 12;
      pdf.setLineWidth(0.5);
      pdf.line(leftMargin, yPos, pageWidth - rightMargin, yPos);

      yPos += 8;
      pdf.setFontSize(10);
      pdf.setFont('courier', 'bold');
      pdf.text('PAYMENT HISTORY', leftMargin + 5, yPos);

      yPos += 8;
      pdf.setFontSize(8);
      
      // Table headers
      pdf.setFont('courier', 'bold');
      pdf.text('#', leftMargin + 10, yPos);
      pdf.text('Date', leftMargin + 20, yPos);
      pdf.text('Method', leftMargin + 50, yPos);
      pdf.text('Amount', summaryValueX, yPos, { align: 'right' });

      yPos += 6;
      pdf.setLineWidth(0.3);
      pdf.line(leftMargin + 5, yPos, pageWidth - rightMargin - 5, yPos);

      yPos += 6;
      pdf.setFont('courier', 'normal');

      sale.paymentHistory.forEach((p, idx) => {
        const isCurrentPayment = idx === paymentIndex;
        
        if (isCurrentPayment) {
          pdf.setFillColor(200, 200, 200);
          pdf.rect(leftMargin + 3, yPos - 4, pageWidth - rightMargin - 6, 5.5, 'F');
          pdf.setFont('courier', 'bold');
        }

        const paymentNum = (idx + 1).toString();
        const dateStr = new Date(p.date).toLocaleDateString('en-IN');
        const amountStr = p.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        pdf.text(paymentNum, leftMargin + 10, yPos);
        pdf.text(dateStr, leftMargin + 20, yPos);
        pdf.text(p.paymentType, leftMargin + 50, yPos);
        pdf.text(amountStr, summaryValueX, yPos, { align: 'right' });

        yPos += 6;

        if (isCurrentPayment) {
          pdf.setFont('courier', 'normal');
        }
      });
    }

    // ===== FOOTER =====
    yPos = pageHeight - 20;
    pdf.setFontSize(9);
    pdf.setFont('courier', 'normal');
    pdf.text('Thank you for your payment!', centerX, yPos, { align: 'center' });

    yPos += 5;
    pdf.setFontSize(8);
    pdf.text('This is a computer-generated receipt. No signature required.', centerX, yPos, { align: 'center' });

    const fileName = `Payment_Receipt_${sale.customerName.replace(/\s+/g, '_')}_${paymentIndex + 1}_${new Date(payment.date).toLocaleDateString().replace(/\//g, '-')}.pdf`;
    pdf.save(fileName);
    
    toast.success('Payment receipt downloaded successfully!');
  } catch (err) {
    console.error('Error generating payment receipt:', err);
    toast.error('Failed to generate payment receipt');
  }
}, [sale]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12 text-muted-foreground">Loading sale details...</div>
        </div>
      </div>
    );
  }

  if (error || !sale) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <Button onClick={() => router.back()} variant="outline" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="text-center py-12 text-destructive">{error || 'Sale not found'}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-3xl mx-auto space-y-4">
        {/* Compact Header */}
        <div className="flex items-center justify-between">
          <Button onClick={() => router.back()} variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          {sale.balanceAmount > 0 && (
            <Button onClick={() => setPaymentDialogOpen(true)} size="sm">
              Add Payment
            </Button>
          )}
        </div>

        {/* Main Info Card */}
        <div className="bg-white rounded-lg border p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-lg font-semibold">{sale.customerName}</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {new Date(sale.date).toLocaleDateString('en-IN')}
              </p>
            </div>
            <Badge
              variant={sale.status === 'PAID' ? 'secondary' : 'default'}
              className={sale.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}
            >
              {sale.status}
            </Badge>
          </div>

          {/* Amount Summary */}
          <div className="grid grid-cols-3 gap-2 pt-3 border-t">
            <div>
              <p className="text-xs text-gray-500">Total</p>
              <p className="text-sm font-semibold">₹{sale.totalAmount.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Paid</p>
              <p className="text-sm font-semibold text-green-600">₹{sale.initialPayment.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Balance</p>
              <p className={`text-sm font-semibold ${sale.balanceAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                ₹{sale.balanceAmount.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="p-3 border-b bg-gray-50">
            <h3 className="text-sm font-semibold">Items</h3>
          </div>
          <div className="divide-y">
            {sale.items.map((item, idx) => (
              <div key={idx} className="p-3 flex justify-between items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium">{item.productName}</p>
                  <p className="text-xs text-gray-500">Qty: {item.quantity} × ₹{item.price.toFixed(2)}</p>
                </div>
                <p className="text-sm font-semibold">₹{item.subtotal.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Payment History */}
        {sale.paymentHistory && sale.paymentHistory.length > 0 && (
          <div className="bg-white rounded-lg border overflow-hidden">
            <div className="p-3 border-b bg-gray-50">
              <h3 className="text-sm font-semibold">Payment History</h3>
            </div>
            <div className="divide-y">
              {sale.paymentHistory.map((payment, idx) => (
                <div key={idx} className="p-3 flex justify-between items-center gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {new Date(payment.date).toLocaleDateString('en-IN')}
                    </p>
                    <p className="text-xs text-gray-500">{payment.paymentType}</p>
                  </div>
                  <p className="text-sm font-semibold text-green-600">₹{payment.amount.toFixed(2)}</p>
                  <Button 
                    onClick={() => generatePaymentReceipt(payment, idx)} 
                    variant="ghost" 
                    size="sm"
                    className="h-7 px-2"
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        {sale.balanceAmount === 0 && (
          <div className="flex gap-2">
            <Button onClick={generateAndDownloadInvoice} variant="outline" size="sm" className="flex-1">
              Download Invoice
            </Button>
          </div>
        )}
      </div>

      {/* Payment Dialog */}
      <MakePaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        sale={sale}
        paymentAmount={paymentAmount}
        setPaymentAmount={setPaymentAmount}
        paymentType={paymentType}
        setPaymentType={setPaymentType}
        error={paymentError}
        loading={paymentLoading}
        onConfirmPayment={handleMakePayment}
      />
    </div>
  );
}
