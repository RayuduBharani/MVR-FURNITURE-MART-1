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
      {sales.map((sale) => (
        <Card key={sale._id} className="p-4 border-0 shadow-sm bg-white">
          <button
            onClick={() => onToggleExpand(sale._id)}
            className="w-full text-left"
          >
            <div className="flex justify-between items-center">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-gray-900">{sale.customerName}</h3>
                  <Badge 
                    variant={sale.status === 'PAID' ? 'secondary' : 'default'} 
                    className={sale.status === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
                  >
                    {sale.status}
                  </Badge>
                  <Badge variant="outline" className="text-gray-600">
                    {sale.paymentType}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {new Date(sale.date).toLocaleDateString()} • {sale.items.length} items
                </p>
                {sale.balanceAmount > 0 && (
                  <div className="mt-2 flex gap-4 text-xs">
                    <div>
                      <span className="text-gray-500">Total: </span>
                      <span className="font-semibold text-gray-700">₹{sale.totalAmount.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Paid: </span>
                      <span className="font-semibold text-green-600">₹{sale.initialPayment.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Balance: </span>
                      <span className="font-semibold text-red-600">₹{sale.balanceAmount.toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="text-right">
                <p className="font-bold text-lg text-orange-600">₹{sale.totalAmount.toFixed(2)}</p>
                {sale.balanceAmount > 0 && (
                  <p className="text-xs text-red-600 mt-1">
                    Due: ₹{sale.balanceAmount.toFixed(2)}
                  </p>
                )}
              </div>
            </div>
          </button>

          {/* Quick EMI Payment Button - Always Visible for Pending */}
          {sale.balanceAmount > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100 flex gap-2">
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onPayEMI(sale);
                }}
                size="sm"
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium"
              >
                💰 Pay EMI
              </Button>
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleExpand(sale._id);
                }}
                size="sm"
                variant="outline"
                className="flex-1"
              >
                📋 View Details
              </Button>
            </div>
          )}

          {/* Expanded Details */}
          {expandedSale === sale._id && (
            <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
              <div className="space-y-2">
                {sale.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {item.productName} × {item.quantity}
                    </span>
                    <span className="font-medium text-gray-900">₹{item.subtotal.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Payment History */}
              {sale.paymentHistory && sale.paymentHistory.length > 0 && (
                <div className="pt-3 border-t border-gray-100">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">💳 Payment History:</h4>
                  <div className="space-y-2">
                    {sale.paymentHistory.map((payment, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm bg-green-50 p-2 rounded border border-green-200">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">Installment {idx + 1}</span>
                          <span className="text-gray-600 text-xs">
                            {new Date(payment.date).toLocaleDateString()} • {payment.paymentType}
                          </span>
                        </div>
                        <span className="font-semibold text-green-600">₹{payment.amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(sale.initialPayment > 0 || sale.balanceAmount > 0) && (
                <div className="pt-2 border-t border-gray-100">
                  <div className="bg-blue-50 p-3 rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700 font-medium">Total Amount:</span>
                      <span className="font-semibold text-gray-900">₹{sale.totalAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-green-700 font-medium">Paid:</span>
                      <span className="font-semibold text-green-600">₹{sale.initialPayment.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm pt-2 border-t border-blue-200">
                      <span className="text-red-700 font-medium">Balance Due:</span>
                      <span className="font-bold text-red-600">₹{sale.balanceAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex gap-2 pt-2">
                {sale.balanceAmount > 0 && (
                  <Button
                    onClick={() => onPayEMI(sale)}
                    size="sm"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    💰 Make Payment
                  </Button>
                )}
                <Button
                  onClick={() => onDownloadInvoice(sale)}
                  size="sm"
                  variant="outline"
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download Invoice
                </Button>
                <Button
                  onClick={() => window.location.href = `/sales/${sale._id}`}
                  size="sm"
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                >
                  📋 View Complete Details
                </Button>
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
