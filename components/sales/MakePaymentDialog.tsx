'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PaymentHistory {
  date: string;
  amount: number;
  paymentType: string;
}

interface Sale {
  _id: string;
  customerName: string;
  totalAmount: number;
  initialPayment: number;
  balanceAmount: number;
  paymentHistory: PaymentHistory[];
}

interface MakePaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sale: Sale | null;
  paymentAmount: string;
  setPaymentAmount: (amount: string) => void;
  paymentType: 'CASH' | 'UPI' | 'CARD' | 'OTHER';
  setPaymentType: (type: 'CASH' | 'UPI' | 'CARD' | 'OTHER') => void;
  error: string;
  loading: boolean;
  onConfirmPayment: () => void;
}

export default function MakePaymentDialog({
  open,
  onOpenChange,
  sale,
  paymentAmount,
  setPaymentAmount,
  paymentType,
  setPaymentType,
  error,
  loading,
  onConfirmPayment,
}: MakePaymentDialogProps) {
  if (!sale) return null;
  
  const totalPaid = sale.paymentHistory?.reduce((sum, p) => sum + p.amount, 0) || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Make EMI Payment</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="bg-blue-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Customer:</span>
              <span className="font-semibold">{sale.customerName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Amount:</span>
              <span className="font-semibold">₹{sale.totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Already Paid:</span>
              <span className="font-semibold text-green-600">
                ₹{totalPaid.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-gray-600 font-medium">Balance Due:</span>
              <span className="font-bold text-red-600">
                ₹{sale.balanceAmount.toFixed(2)}
              </span>
            </div>
          </div>

          <div>
            <Label htmlFor="paymentAmount">Payment Amount (₹)</Label>
            <Input
              id="paymentAmount"
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              placeholder={`Max: ₹${sale.balanceAmount.toFixed(2)}`}
              min="1"
              max={sale.balanceAmount}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="paymentType">Payment Method</Label>
            <Select
              value={paymentType}
              onValueChange={(value) =>
                setPaymentType(value as 'CASH' | 'UPI' | 'CARD' | 'OTHER')
              }
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CASH">Cash</SelectItem>
                <SelectItem value="UPI">UPI</SelectItem>
                <SelectItem value="CARD">Card</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                setPaymentAmount('');
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={onConfirmPayment}
              disabled={loading || !paymentAmount}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? 'Processing...' : 'Pay Now'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
