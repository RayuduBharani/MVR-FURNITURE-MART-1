'use client';

import { AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PaymentHistory {
  date: string;
  amount: number;
  paymentType: string;
}

interface Sale {
  id: string;
  customerName: string;
  totalAmount: number;
  initialPayment: number;
  balanceAmount: number;
  paymentHistory: PaymentHistory[];
}

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sale: Sale | null;
  paymentAmount: string;
  setPaymentAmount: (amount: string) => void;
  error: string;
  loading: boolean;
  onConfirmPayment: () => void;
}

export default function PaymentDialog({
  open,
  onOpenChange,
  sale,
  paymentAmount,
  setPaymentAmount,
  error,
  loading,
  onConfirmPayment,
}: PaymentDialogProps) {
  if (!sale) return null;
  
  const totalPaid = sale.paymentHistory?.reduce((sum, p) => sum + p.amount, 0) || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Make EMI Payment</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Customer:</span>
              <span className="font-medium">{sale.customerName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Amount:</span>
              <span className="font-medium">₹{sale.totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Already Paid:</span>
              <span className="font-medium text-green-600">₹{totalPaid.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t border-gray-200">
              <span className="text-gray-700 font-semibold">Balance Due:</span>
              <span className="font-bold text-red-600">₹{sale.balanceAmount.toFixed(2)}</span>
            </div>
          </div>

          <div>
            <Label htmlFor="payment-amount" className="text-sm font-medium">Payment Amount</Label>
            <Input
              id="payment-amount"
              type="number"
              min="0"
              max={sale.balanceAmount}
              step="0.01"
              placeholder="Enter payment amount"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              className="mt-2"
            />
            <p className="text-xs text-gray-500 mt-1">
              Maximum: ₹{sale.balanceAmount.toFixed(2)}
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                setPaymentAmount('');
              }}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={onConfirmPayment}
              disabled={loading || !paymentAmount}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Processing...' : 'Confirm Payment'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
