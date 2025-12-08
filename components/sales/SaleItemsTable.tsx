'use client';

import { Card } from '@/components/ui/card';

interface CartItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  subtotal: number;
}

interface SaleItemsTableProps {
  items: CartItem[];
  totalAmount: number;
}

export default function SaleItemsTable({ items, totalAmount }: SaleItemsTableProps) {
  return (
    <Card className="p-6 bg-white shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Items ({items.length})
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="text-left p-3 font-medium text-gray-600">Product</th>
              <th className="text-center p-3 font-medium text-gray-600">Qty</th>
              <th className="text-right p-3 font-medium text-gray-600">Price</th>
              <th className="text-right p-3 font-medium text-gray-600">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx} className="border-b">
                <td className="p-3 text-gray-900">{item.productName}</td>
                <td className="p-3 text-center text-gray-700">{item.quantity}</td>
                <td className="p-3 text-right text-gray-700">₹{item.price.toFixed(2)}</td>
                <td className="p-3 text-right font-semibold text-gray-900">
                  ₹{item.subtotal.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-orange-50">
              <td colSpan={3} className="p-3 text-right font-semibold text-gray-900">
                Total:
              </td>
              <td className="p-3 text-right font-bold text-orange-600">
                ₹{totalAmount.toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </Card>
  );
}
