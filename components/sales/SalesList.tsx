'use client';

import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

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
  paymentHistory: PaymentHistory[];
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    subtotal: number;
  }>;
}

interface SalesListProps {
  sales: Sale[];
  expandedSale: string | null;
  onToggleExpand: (saleId: string) => void;
  onPayEMI: (sale: Sale) => void;
  onDownloadInvoice: (sale: Sale) => void;
}

export default function SalesList({
  sales,
  expandedSale,
  onToggleExpand,
  onPayEMI,
  onDownloadInvoice,
}: SalesListProps) {
  return (
    <div className="space-y-3">
      {sales.map((sale) => {
        const isPaid = sale.status === 'PAID' && sale.balanceAmount === 0;
        
        return (
          <Card 
            key={sale._id} 
            className="p-4 hover:shadow-md transition-shadow"
          >
            <button
              onClick={() => onToggleExpand(sale._id)}
              className="w-full text-left"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{sale.customerName}</h3>
                    <Badge variant={isPaid ? "default" : "secondary"} className="text-xs">
                      {isPaid ? 'PAID' : 'PENDING'}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {sale.paymentType}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {new Date(sale.date).toLocaleDateString()} • {sale.items.length} items
                  </p>
                  
                  <div className="flex gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Total: </span>
                      <span className="font-semibold">₹{sale.totalAmount.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Paid: </span>
                      <span className="font-semibold text-green-600">₹{sale.initialPayment.toFixed(2)}</span>
                    </div>
                    {sale.balanceAmount > 0 && (
                      <div>
                        <span className="text-gray-500">Balance: </span>
                        <span className="font-semibold text-red-600">₹{sale.balanceAmount.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-right ml-4">
                  <div className="font-bold text-xl">₹{sale.totalAmount.toFixed(2)}</div>
                  {isPaid ? (
                    <Badge className="bg-green-600">Paid</Badge>
                  ) : (
                    <Badge variant="destructive">₹{sale.balanceAmount.toFixed(2)} due</Badge>
                  )}
                </div>
              </div>
            </button>

          {/* Action Buttons */}
          <div className="mt-3 pt-3 border-t flex gap-2">
            {sale.balanceAmount > 0 && (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onPayEMI(sale);
                }}
                size="sm"
                className="flex-1"
              >
                Pay EMI
              </Button>
            )}
            {isPaid && (
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onDownloadInvoice(sale);
                }}
                size="sm"
                variant="outline"
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-1" />
                Invoice
              </Button>
            )}
            <Button
              onClick={(e) => {
                e.stopPropagation();
                window.location.href = `/sales/${sale._id}`;
              }}
              size="sm"
              variant="outline"
              className="flex-1"
            >
              Details
            </Button>
          </div>

          {/* Expanded Details */}
          {expandedSale === sale._id && (
            <div className="mt-3 pt-3 border-t space-y-3">
              <div className="space-y-1">
                {sale.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {item.productName} × {item.quantity}
                    </span>
                    <span className="font-medium">₹{item.subtotal.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Payment History */}
              {sale.paymentHistory && sale.paymentHistory.length > 0 && (
                <div className="pt-2 border-t">
                  <h4 className="text-sm font-semibold mb-2">Payment History</h4>
                  <div className="space-y-1">
                    {sale.paymentHistory.map((payment, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm bg-gray-50 p-2 rounded">
                        <div>
                          <span className="font-medium">EMI {idx + 1}</span>
                          <span className="text-gray-500 text-xs ml-2">
                            {new Date(payment.date).toLocaleDateString()} • {payment.paymentType}
                          </span>
                        </div>
                        <span className="font-semibold">₹{payment.amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Payment Summary */}
              <div className="pt-2 border-t bg-gray-50 p-3 rounded text-sm">
                <div className="flex justify-between mb-1">
                  <span className="text-gray-600">Total:</span>
                  <span className="font-semibold">₹{sale.totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span className="text-gray-600">Paid:</span>
                  <span className="font-semibold text-green-600">₹{sale.initialPayment.toFixed(2)}</span>
                </div>
                {sale.balanceAmount > 0 ? (
                  <div className="flex justify-between pt-1 border-t">
                    <span className="text-gray-600">Balance:</span>
                    <span className="font-bold text-red-600">₹{sale.balanceAmount.toFixed(2)}</span>
                  </div>
                ) : (
                  <div className="pt-1 border-t text-center">
                    <Badge className="bg-green-600">Fully Paid</Badge>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                {sale.balanceAmount > 0 && (
                  <Button
                    onClick={() => onPayEMI(sale)}
                    size="sm"
                    className="flex-1"
                  >
                    Make Payment
                  </Button>
                )}
                <Button
                  onClick={() => onDownloadInvoice(sale)}
                  size="sm"
                  variant="outline"
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Invoice
                </Button>
                <Button
                  onClick={() => window.location.href = `/sales/${sale._id}`}
                  size="sm"
                  variant="outline"
                  className="flex-1"
                >
                  Full Details
                </Button>
              </div>
            </div>
          )}
        </Card>
        );
      })}
    </div>
  );
}
