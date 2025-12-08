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
    <Card className="p-6 border-0 shadow-sm bg-white sticky top-4">
      <h2 className="text-lg font-semibold mb-4 text-gray-900">Bill Summary</h2>

      {/* Cart Items */}
      <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
        {cart.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">Cart is empty</p>
        ) : (
          cart.map((item) => (
            <div key={item.productId} className="p-3 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{item.productName}</p>
                  <p className="text-xs text-gray-600">
                    {item.quantity} × ₹{item.price}
                  </p>
                </div>
                <button
                  onClick={() => onRemoveItem(item.productId)}
                  className="p-1 hover:bg-red-100 rounded transition-colors"
                >
                  <X className="h-3 w-3 text-red-600" />
                </button>
              </div>
              <div className="text-right text-sm font-semibold text-orange-600">
                ₹{item.subtotal.toFixed(2)}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Totals */}
      <div className="border-t border-gray-200 pt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Items</span>
          <span className="font-medium text-gray-900">{cart.length}</span>
        </div>
        <div className="flex justify-between text-lg font-bold text-gray-900 bg-orange-50 p-3 rounded-lg">
          <span>Total Amount</span>
          <span className="text-orange-600">₹{totalAmount.toFixed(2)}</span>
        </div>
        {initialPayment && parseFloat(initialPayment) > 0 && (
          <>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Initial Payment</span>
              <span className="font-medium text-green-600">₹{parseFloat(initialPayment).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-md font-semibold bg-yellow-50 p-2 rounded">
              <span className="text-gray-700">Balance Due</span>
              <span className="text-red-600">₹{(totalAmount - parseFloat(initialPayment)).toFixed(2)}</span>
            </div>
          </>
        )}
      </div>

      {/* Status Badge */}
      {cart.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <Badge
            variant={isPendingBill ? 'default' : 'secondary'}
            className={isPendingBill ? 'bg-yellow-100 text-yellow-800 w-full text-center' : 'bg-green-100 text-green-800 w-full text-center'}
          >
            {isPendingBill ? 'PENDING BILL' : 'PAID'}
          </Badge>
        </div>
      )}

      {/* Create Bill Button */}
      <Button
        onClick={onCreateBill}
        disabled={loading || cart.length === 0}
        className="w-full mt-4 bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-50"
      >
        {loading ? 'Creating...' : 'Create & Download Invoice'}
      </Button>
    </Card>
  );
}
