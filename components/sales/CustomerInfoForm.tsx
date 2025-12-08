'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';

interface CustomerInfoFormProps {
  customerName: string;
  setCustomerName: (name: string) => void;
  phoneNumber1: string;
  setPhoneNumber1: (phone: string) => void;
  phoneNumber2: string;
  setPhoneNumber2: (phone: string) => void;
  address: string;
  setAddress: (address: string) => void;
  notes: string;
  setNotes: (notes: string) => void;
  paymentType: 'CASH' | 'UPI' | 'CARD' | 'OTHER';
  setPaymentType: (type: 'CASH' | 'UPI' | 'CARD' | 'OTHER') => void;
  initialPayment: string;
  setInitialPayment: (payment: string) => void;
  isPendingBill: boolean;
  setIsPendingBill: (pending: boolean) => void;
  serialNumber: string;
  setSerialNumber: (serialNumber: string) => void;
}

export default function CustomerInfoForm({
  customerName,
  setCustomerName,
  phoneNumber1,
  setPhoneNumber1,
  phoneNumber2,
  setPhoneNumber2,
  address,
  setAddress,
  notes,
  setNotes,
  paymentType,
  setPaymentType,
  initialPayment,
  setInitialPayment,
  isPendingBill,
  setIsPendingBill,
  serialNumber,
  setSerialNumber,
}: CustomerInfoFormProps) {
  return (
    <Card className="p-6 shadow-md">
      <h2 className="text-lg font-semibold mb-4 text-foreground">Customer Information</h2>
      <div className="space-y-4">
        <div>
          <Label className="text-sm font-medium text-foreground">Customer Name (Optional)</Label>
          <Input
            placeholder="Enter customer name or leave blank for Walk-in"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="mt-2"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium text-foreground">Phone Number 1</Label>
            <Input
              type="tel"
              placeholder="Enter phone number"
              value={phoneNumber1}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '' || /^\d*$/.test(value)) {
                  setPhoneNumber1(value);
                }
              }}
              className="mt-2"
              maxLength={10}
            />
          </div>
          <div>
            <Label className="text-sm font-medium text-foreground">Phone Number 2 (Optional)</Label>
            <Input
              type="tel"
              placeholder="Enter phone number"
              value={phoneNumber2}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '' || /^\d*$/.test(value)) {
                  setPhoneNumber2(value);
                }
              }}
              className="mt-2"
              maxLength={10}
            />
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium text-foreground">Address</Label>
          <Textarea
            placeholder="Enter customer address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="mt-2 resize-none"
            rows={3}
          />
        </div>

        <div>
          <Label className="text-sm font-medium text-foreground">Notes / Other Details</Label>
          <Textarea
            placeholder="Enter any additional notes or details"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-2 resize-none"
            rows={3}
          />
        </div>

        <div>
          <Label className="text-sm font-medium text-foreground">Payment Type</Label>
          <Select value={paymentType} onValueChange={(value) => setPaymentType(value as 'CASH' | 'UPI' | 'CARD' | 'OTHER')}>
            <SelectTrigger className="mt-2">
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
            className="w-4 h-4 rounded"
          />
          <Label htmlFor="pending" className="text-sm font-medium text-foreground cursor-pointer">
            Mark as Pending Bill (Partial Payment)
          </Label>
        </div>

        {isPendingBill && (
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-foreground">Serial Number</Label>
              <Input
                placeholder="Enter serial number"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                className="mt-2"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-foreground">Initial Payment Amount</Label>
              <Input
                type="tel"
                min="0"
                step="0.01"
                placeholder="Enter initial payment amount"
                value={initialPayment}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || /^\d*\.?\d*$/.test(value)) {
                    setInitialPayment(value);
                  }
                }}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">Enter the partial amount paid now. Balance will be tracked as pending.</p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
