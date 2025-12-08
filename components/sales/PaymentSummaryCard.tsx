'use client';

import { Download } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface PaymentHistory {
  date: string;
  amount: number;
  paymentType: string;
}

interface PaymentSummaryCardProps {
  totalAmount: number;
  initialPayment: number;
  balanceAmount: number;
  paymentHistory: PaymentHistory[];
  onDownloadReceipt: (payment: PaymentHistory, index: number) => void;
}

export default function PaymentSummaryCard({
  totalAmount,
  initialPayment,
  balanceAmount,
  paymentHistory,
  onDownloadReceipt,
}: PaymentSummaryCardProps) {
  return (
    <Card className="p-6 bg-white shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Summary</h3>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg text-center">
          <p className="text-sm text-gray-500">Total Amount</p>
          <p className="text-xl font-bold text-gray-900">₹{totalAmount.toFixed(2)}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg text-center">
          <p className="text-sm text-green-600">Amount Paid</p>
          <p className="text-xl font-bold text-green-700">₹{initialPayment.toFixed(2)}</p>
        </div>
        <div
          className={`p-4 rounded-lg text-center ${
            balanceAmount > 0 ? 'bg-red-50' : 'bg-green-50'
          }`}
        >
          <p
            className={`text-sm ${
              balanceAmount > 0 ? 'text-red-600' : 'text-green-600'
            }`}
          >
            {balanceAmount > 0 ? 'Balance Due' : 'Fully Paid'}
          </p>
          <p
            className={`text-xl font-bold ${
              balanceAmount > 0 ? 'text-red-700' : 'text-green-700'
            }`}
          >
            ₹{balanceAmount.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Payment History */}
      {paymentHistory && paymentHistory.length > 0 && (
        <div className="border-t pt-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Payment History</h4>
          <div className="space-y-2">
            {paymentHistory.map((payment, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2 py-1 rounded">
                    #{idx + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {new Date(payment.date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                    <p className="text-xs text-gray-500">{payment.paymentType}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-base font-bold text-green-600">
                    ₹{payment.amount.toFixed(2)}
                  </p>
                  <Button
                    onClick={() => onDownloadReceipt(payment, idx)}
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 text-xs"
                    title="Download Receipt"
                  >
                    <Download className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
