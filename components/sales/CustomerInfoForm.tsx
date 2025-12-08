'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';

interface CustomerInfoFormProps {
  customerName: string;
  setCustomerName: (name: string) => void;
  paymentType: 'CASH' | 'UPI' | 'CARD' | 'OTHER';
  setPaymentType: (type: 'CASH' | 'UPI' | 'CARD' | 'OTHER') => void;
  initialPayment: string;
  setInitialPayment: (payment: string) => void;
  isPendingBill: boolean;
  setIsPendingBill: (pending: boolean) => void;
}

export default function CustomerInfoForm({
  customerName,
  setCustomerName,
  paymentType,
  setPaymentType,
  initialPayment,
  setInitialPayment,
  isPendingBill,
  setIsPendingBill,
}: CustomerInfoFormProps) {
  return (
    <Card className="p-6 border-0 shadow-sm bg-white">
      <h2 className="text-lg font-semibold mb-4 text-gray-900">Customer Information</h2>
      <div className="space-y-4">
        <div>
          <Label className="text-sm font-medium text-gray-700">Customer Name (Optional)</Label>
          <Input
            placeholder="Enter customer name or leave blank for Walk-in"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="mt-2 border-gray-300"
          />
        </div>

        <div>
          <Label className="text-sm font-medium text-gray-700">Payment Type</Label>
          <Select value={paymentType} onValueChange={(value) => setPaymentType(value as 'CASH' | 'UPI' | 'CARD' | 'OTHER')}>
            <SelectTrigger className="mt-2 border-gray-300">
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

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="pending"
            checked={isPendingBill}
            onChange={(e) => {
              setIsPendingBill(e.target.checked);
              if (!e.target.checked) {
                setInitialPayment(''); // Clear initial payment when unchecked
              }
            }}
            className="w-4 h-4 rounded border-gray-300"
          />
          <Label htmlFor="pending" className="text-sm font-medium text-gray-700 cursor-pointer">
            Mark as Pending Bill (Partial Payment)
          </Label>
        </div>

        {isPendingBill && (
          <div>
            <Label className="text-sm font-medium text-gray-700">Initial Payment Amount</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="Enter initial payment amount"
              value={initialPayment}
              onChange={(e) => setInitialPayment(e.target.value)}
              className="mt-2 border-gray-300"
            />
            <p className="text-xs text-gray-500 mt-1">Enter the partial amount paid now. Balance will be tracked as pending.</p>
          </div>
        )}
      </div>
    </Card>
  );
}
