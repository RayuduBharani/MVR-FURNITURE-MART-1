'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface CartItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
}

interface BillSummaryProps {
  cart: CartItem[];
  totalAmount: number;
  initialPayment: string;
  isPendingBill: boolean;
  loading: boolean;
  onRemoveItem: (productId: string) => void;
  onCreateBill: () => void;
}

export default function BillSummary({
  cart,
  totalAmount,
  initialPayment,
  isPendingBill,
  loading,
  onRemoveItem,
  onCreateBill,
}: BillSummaryProps) {
  return (
    <Card className="p-6 shadow-md sticky top-4">
      <h2 className="text-lg font-semibold mb-4 text-foreground">Bill Summary</h2>

      {/* Cart Items */}
      <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
        {cart.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Cart is empty</p>
        ) : (
          cart.map((item) => (
            <div key={item.productId} className="p-3 bg-muted/50 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{item.productName}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.quantity} × ₹{item.price}
                  </p>
                </div>
                <button
                  onClick={() => onRemoveItem(item.productId)}
                  className="p-1 hover:bg-destructive/10 rounded transition-colors"
                >
                  <X className="h-3 w-3 text-destructive" />
                </button>
              </div>
              <div className="text-right text-sm font-semibold text-primary">
                ₹{item.subtotal.toFixed(2)}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Totals */}
      <div className="border-t border-border pt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Items</span>
          <span className="font-medium text-foreground">{cart.length}</span>
        </div>
        <div className="flex justify-between text-lg font-bold text-foreground bg-primary/10 p-3 rounded-lg">
          <span>Total Amount</span>
          <span className="text-primary">₹{totalAmount.toFixed(2)}</span>
        </div>
        {initialPayment && parseFloat(initialPayment) > 0 && (
          <>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Initial Payment</span>
              <span className="font-medium text-green-600 dark:text-green-400">₹{parseFloat(initialPayment).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-md font-semibold bg-yellow-50 dark:bg-yellow-950/20 p-2 rounded">
              <span className="text-foreground">Balance Due</span>
              <span className="text-destructive">₹{(totalAmount - parseFloat(initialPayment)).toFixed(2)}</span>
            </div>
          </>
        )}
      </div>

      {/* Status Badge */}
      {cart.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <Badge
            variant={isPendingBill ? 'default' : 'secondary'}
            className={isPendingBill ? 'bg-yellow-100 dark:bg-yellow-950/20 text-yellow-800 dark:text-yellow-400 w-full text-center' : 'bg-green-100 dark:bg-green-950/20 text-green-800 dark:text-green-400 w-full text-center'}
          >
            {isPendingBill ? 'PENDING BILL' : 'PAID'}
          </Badge>
        </div>
      )}

      {/* Create Bill Button */}
      <Button
        onClick={onCreateBill}
        disabled={loading || cart.length === 0}
        className="w-full mt-4"
      >
        {loading ? 'Creating...' : 'Create & Download Invoice'}
      </Button>
    </Card>
  );
}
