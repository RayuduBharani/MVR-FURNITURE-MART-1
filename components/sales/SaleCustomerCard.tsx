'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SaleCustomerCardProps {
  customerName: string;
  date: string;
  status: string;
  paymentType: string;
  totalAmount: number;
  balanceAmount: number;
  serialNumber?: string;
}

export default function SaleCustomerCard({
  customerName,
  date,
  status,
  paymentType,
  totalAmount,
  balanceAmount,
  serialNumber,
}: SaleCustomerCardProps) {
  return (
    <Card className="p-6 bg-white shadow-sm">
      <div className="flex justify-between items-start flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{customerName}</h2>
          <p className="text-gray-600 mt-1">
            {new Date(date).toLocaleDateString('en-IN', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
          {serialNumber && (
            <p className="text-sm text-gray-600 mt-1">
              Serial Number: <span className="font-semibold">{serialNumber}</span>
            </p>
          )}
          <div className="flex gap-2 mt-3">
            <Badge
              variant={status === 'PAID' ? 'secondary' : 'default'}
              className={
                status === 'PAID'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-yellow-100 text-yellow-800'
              }
            >
              {status}
            </Badge>
            <Badge variant="outline">{paymentType}</Badge>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Total Amount</p>
          <p className="text-3xl font-bold text-orange-600">
            ₹{totalAmount.toFixed(2)}
          </p>
          {balanceAmount > 0 && (
            <p className="text-sm text-red-600 mt-1">
              Balance: ₹{balanceAmount.toFixed(2)}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
