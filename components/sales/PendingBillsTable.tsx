'use client';

import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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

interface PendingBillsTableProps {
  sales: Sale[];
  onPayEMI: (sale: Sale) => void;
}

export default function PendingBillsTable({ sales, onPayEMI }: PendingBillsTableProps) {
  return (
    <div className="rounded-lg border bg-white shadow-sm overflow-hidden">
      <Table className="text-base">
        <TableHeader className="bg-gray-50">
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Payment Type</TableHead>
            <TableHead>Date / Items</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="text-right">Paid</TableHead>
            <TableHead className="text-right">Balance</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sales.map((sale) => {
            const totalPaid = sale.initialPayment + (sale.paymentHistory?.reduce((sum, p) => sum + p.amount, 0) || 0);
            const actualBalance = sale.totalAmount - totalPaid;

            return (
              <TableRow key={sale._id} className="bg-gray-50/70">
                <TableCell className="font-semibold text-gray-900">{sale.customerName}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-gray-700 border-gray-200">
                    {sale.paymentType}
                  </Badge>
                </TableCell>
                <TableCell className="text-gray-700">
                  {new Date(sale.date).toLocaleDateString()} • {sale.items.length} items
                </TableCell>
                <TableCell className="text-right font-semibold text-gray-900">₹{sale.totalAmount.toFixed(2)}</TableCell>
                <TableCell className="text-right font-semibold text-green-700">₹{totalPaid.toFixed(2)}</TableCell>
                <TableCell className="text-right">
                  <Badge variant="secondary" className="bg-red-100 text-red-700">
                    ₹{actualBalance.toFixed(2)}
                  </Badge>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  {actualBalance > 0 && (
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={() => onPayEMI(sale)}
                    >
                      Pay EMI
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.location.href = `/sales/${sale._id}`}
                    title="View Complete Details"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Details
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
