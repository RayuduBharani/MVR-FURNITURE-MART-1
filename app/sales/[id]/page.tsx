'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';    
import { getSaleById, makeAdditionalPayment } from '@/actions/sales-actions';
import jsPDF from 'jspdf';
import SaleDetailsHeader from '@/components/sales/SaleDetailsHeader';
import SaleCustomerCard from '@/components/sales/SaleCustomerCard';
import PaymentSummaryCard from '@/components/sales/PaymentSummaryCard';
import SaleItemsTable from '@/components/sales/SaleItemsTable';
import SaleActionsCard from '@/components/sales/SaleActionsCard';
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
  _id: string;
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
      const result = await makeAdditionalPayment(sale._id, amount, paymentType);
      
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
      
      // Header
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('MVR FURNITURE MART', pageWidth / 2, 20, { align: 'center' });
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Quality Furniture for Every Home', pageWidth / 2, 27, { align: 'center' });
      
      // Line separator
      pdf.setLineWidth(0.5);
      pdf.line(15, 32, pageWidth - 15, 32);
      
      // Invoice title
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('INVOICE', pageWidth / 2, 42, { align: 'center' });
      
      // Customer info
      let yPosition = 55;
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Customer:', 15, yPosition);
      pdf.setFont('helvetica', 'normal');
      pdf.text(sale.customerName, 45, yPosition);
      
      yPosition += 7;
      pdf.setFont('helvetica', 'bold');
      pdf.text('Date:', 15, yPosition);
      pdf.setFont('helvetica', 'normal');
      pdf.text(new Date(sale.date).toLocaleDateString(), 45, yPosition);
      
      yPosition += 7;
      pdf.setFont('helvetica', 'bold');
      pdf.text('Payment:', 15, yPosition);
      pdf.setFont('helvetica', 'normal');
      pdf.text(sale.paymentType, 45, yPosition);
      
      yPosition += 7;
      pdf.setFont('helvetica', 'bold');
      pdf.text('Status:', 15, yPosition);
      pdf.setFont('helvetica', 'normal');
      pdf.text(sale.status, 45, yPosition);
      
      // Items table header
      yPosition += 15;
      pdf.setFillColor(245, 245, 245);
      pdf.rect(15, yPosition - 5, pageWidth - 30, 10, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.text('Item', 20, yPosition);
      pdf.text('Qty', 100, yPosition);
      pdf.text('Price', 130, yPosition);
      pdf.text('Total', 165, yPosition);
      
      // Items
      yPosition += 10;
      pdf.setFont('helvetica', 'normal');
      sale.items.forEach((item) => {
        pdf.text(item.productName.substring(0, 30), 20, yPosition);
        pdf.text(item.quantity.toString(), 100, yPosition);
        pdf.text(`₹${item.price.toFixed(2)}`, 130, yPosition);
        pdf.text(`₹${item.subtotal.toFixed(2)}`, 165, yPosition);
        yPosition += 8;
      });
      
      // Total section
      yPosition += 5;
      pdf.line(15, yPosition, pageWidth - 15, yPosition);
      yPosition += 10;
      
      pdf.setFont('helvetica', 'bold');
      pdf.text('Total Amount:', 120, yPosition);
      pdf.text(`₹${sale.totalAmount.toFixed(2)}`, pageWidth - 25, yPosition, { align: 'right' });
      
      if (sale.initialPayment > 0) {
        yPosition += 8;
        pdf.setFont('helvetica', 'normal');
        pdf.text('Amount Paid:', 120, yPosition);
        pdf.text(`₹${sale.initialPayment.toFixed(2)}`, pageWidth - 25, yPosition, { align: 'right' });
        
        if (sale.balanceAmount > 0) {
          yPosition += 8;
          pdf.setFont('helvetica', 'bold');
          pdf.setTextColor(255, 0, 0);
          pdf.text('Balance Due:', 120, yPosition);
          pdf.text(`₹${sale.balanceAmount.toFixed(2)}`, pageWidth - 25, yPosition, { align: 'right' });
          pdf.setTextColor(0, 0, 0);
        }
      }
      
      // Payment History
      if (sale.paymentHistory && sale.paymentHistory.length > 0) {
        yPosition += 15;
        pdf.setFont('helvetica', 'bold');
        pdf.text('Payment History:', 15, yPosition);
        yPosition += 8;
        
        pdf.setFont('helvetica', 'normal');
        sale.paymentHistory.forEach((payment, idx) => {
          pdf.text(`${idx + 1}. ${new Date(payment.date).toLocaleDateString()} - ${payment.paymentType}`, 20, yPosition);
          pdf.text(`₹${payment.amount.toFixed(2)}`, pageWidth - 25, yPosition, { align: 'right' });
          yPosition += 7;
        });
      }
      
      // Footer
      yPosition = pdf.internal.pageSize.getHeight() - 20;
      pdf.setFontSize(9);
      pdf.text('Thank you for your business!', pageWidth / 2, yPosition, { align: 'center' });
      
      pdf.save(`Invoice_${sale.customerName}_${new Date(sale.date).toLocaleDateString().replace(/\//g, '-')}.pdf`);
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
      
      // Header
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text('MVR FURNITURE MART', pageWidth / 2, 20, { align: 'center' });
      
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Quality Furniture for Every Home', pageWidth / 2, 27, { align: 'center' });
      
      // Line separator
      pdf.setLineWidth(0.5);
      pdf.line(15, 32, pageWidth - 15, 32);
      
      // Receipt title
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('PAYMENT RECEIPT', pageWidth / 2, 42, { align: 'center' });
      
      // Receipt info
      let yPosition = 55;
      pdf.setFontSize(11);
      
      pdf.setFont('helvetica', 'bold');
      pdf.text('Receipt #:', 15, yPosition);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`${sale._id}-${paymentIndex + 1}`, 50, yPosition);
      
      yPosition += 7;
      pdf.setFont('helvetica', 'bold');
      pdf.text('Customer:', 15, yPosition);
      pdf.setFont('helvetica', 'normal');
      pdf.text(sale.customerName, 50, yPosition);
      
      yPosition += 7;
      pdf.setFont('helvetica', 'bold');
      pdf.text('Payment Date:', 15, yPosition);
      pdf.setFont('helvetica', 'normal');
      pdf.text(new Date(payment.date).toLocaleDateString('en-IN'), 50, yPosition);
      
      yPosition += 7;
      pdf.setFont('helvetica', 'bold');
      pdf.text('Payment Method:', 15, yPosition);
      pdf.setFont('helvetica', 'normal');
      pdf.text(payment.paymentType, 50, yPosition);
      
      yPosition += 7;
      pdf.setFont('helvetica', 'bold');
      pdf.text('Installment:', 15, yPosition);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`#${paymentIndex + 1} of ${sale.paymentHistory.length}`, 50, yPosition);
      
      // Payment box
      yPosition += 20;
      pdf.setFillColor(34, 197, 94); // Green color
      pdf.rect(15, yPosition - 5, pageWidth - 30, 25, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('AMOUNT PAID', pageWidth / 2, yPosition + 5, { align: 'center' });
      pdf.setFontSize(22);
      pdf.text(`₹${payment.amount.toFixed(2)}`, pageWidth / 2, yPosition + 15, { align: 'center' });
      pdf.setTextColor(0, 0, 0);
      
      // Sale Summary
      yPosition += 35;
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Sale Summary:', 15, yPosition);
      
      yPosition += 10;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      
      pdf.text('Total Sale Amount:', 20, yPosition);
      pdf.text(`₹${sale.totalAmount.toFixed(2)}`, pageWidth - 20, yPosition, { align: 'right' });
      
      yPosition += 7;
      pdf.text('Total Paid to Date:', 20, yPosition);
      pdf.setTextColor(34, 197, 94);
      pdf.text(`₹${sale.initialPayment.toFixed(2)}`, pageWidth - 20, yPosition, { align: 'right' });
      pdf.setTextColor(0, 0, 0);
      
      yPosition += 7;
      pdf.setFont('helvetica', 'bold');
      pdf.text('Balance Remaining:', 20, yPosition);
      if (sale.balanceAmount > 0) {
        pdf.setTextColor(239, 68, 68);
      } else {
        pdf.setTextColor(34, 197, 94);
      }
      pdf.text(`₹${sale.balanceAmount.toFixed(2)}`, pageWidth - 20, yPosition, { align: 'right' });
      pdf.setTextColor(0, 0, 0);
      
      // Payment History
      if (sale.paymentHistory.length > 1) {
        yPosition += 15;
        pdf.setFont('helvetica', 'bold');
        pdf.text('Payment History:', 15, yPosition);
        yPosition += 8;
        
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        sale.paymentHistory.forEach((p, idx) => {
          const isCurrentPayment = idx === paymentIndex;
          if (isCurrentPayment) {
            pdf.setFillColor(254, 243, 199); // Yellow highlight
            pdf.rect(15, yPosition - 4, pageWidth - 30, 6, 'F');
            pdf.setFont('helvetica', 'bold');
          }
          
          pdf.text(`${idx + 1}. ${new Date(p.date).toLocaleDateString('en-IN')} - ${p.paymentType}`, 20, yPosition);
          pdf.text(`₹${p.amount.toFixed(2)}`, pageWidth - 20, yPosition, { align: 'right' });
          yPosition += 6;
          
          if (isCurrentPayment) {
            pdf.setFont('helvetica', 'normal');
          }
        });
      }
      
      // Footer
      yPosition = pdf.internal.pageSize.getHeight() - 30;
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Thank you for your payment!', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 7;
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text('This is a computer-generated receipt and does not require a signature.', pageWidth / 2, yPosition, { align: 'center' });
      
      pdf.save(`Payment_Receipt_${sale.customerName}_${paymentIndex + 1}_${new Date(payment.date).toLocaleDateString().replace(/\//g, '-')}.pdf`);
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
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <SaleDetailsHeader
          onBack={() => router.back()}
          hasBalance={sale.balanceAmount > 0}
          onAddPayment={() => setPaymentDialogOpen(true)}
        />

        {/* Customer Info Card */}
        <SaleCustomerCard
          customerName={sale.customerName}
          date={sale.date}
          status={sale.status}
          paymentType={sale.paymentType}
          totalAmount={sale.totalAmount}
          balanceAmount={sale.balanceAmount}
          serialNumber={sale.serialNumber}
        />

        {/* Payment Summary */}
        <PaymentSummaryCard
          totalAmount={sale.totalAmount}
          initialPayment={sale.initialPayment}
          balanceAmount={sale.balanceAmount}
          paymentHistory={sale.paymentHistory}
          onDownloadReceipt={generatePaymentReceipt}
        />

        {/* Items */}
        <SaleItemsTable items={sale.items} totalAmount={sale.totalAmount} />

        {/* Actions */}
        <SaleActionsCard
          hasBalance={sale.balanceAmount > 0}
          onDownloadInvoice={generateAndDownloadInvoice}
          onMakePayment={() => setPaymentDialogOpen(true)}
        />
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
