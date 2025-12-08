'use client';

import { useState } from 'react';
import { Eye, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  serialNumber?: string;
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
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSales = sales.filter((sale) =>
    sale.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (sale.serialNumber && sale.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-3">
      {/* Search Filter */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search by customer name or serial number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="rounded-lg border bg-card shadow-md overflow-hidden">
        <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead>Customer</TableHead>
            <TableHead>Serial Number</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="text-right">Paid</TableHead>
            <TableHead className="text-right">Balance</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredSales.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                {searchQuery ? 'No customers found matching your search' : 'No pending bills'}
              </TableCell>
            </TableRow>
          ) : (
            filteredSales.map((sale) => {
              const totalPaid = sale.paymentHistory?.reduce((sum, p) => sum + p.amount, 0) || 0;
              const actualBalance = sale.totalAmount - totalPaid;

            return (
              <TableRow key={sale._id} className="hover:bg-gray-50">
                <TableCell className="font-medium">{sale.customerName}</TableCell>
                <TableCell className="text-sm">
                  {sale.serialNumber || '-'}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{sale.paymentType}</Badge>
                </TableCell>
                <TableCell className="text-sm text-gray-600">
                  {new Date(sale.date).toLocaleDateString()}
                  <br />
                  {sale.items.length} items
                </TableCell>
                <TableCell className="text-right font-semibold">
                  ₹{sale.totalAmount.toFixed(2)}
                </TableCell>
                <TableCell className="text-right text-green-600 font-semibold">
                  ₹{totalPaid.toFixed(2)}
                </TableCell>
                <TableCell className="text-right text-red-600 font-semibold">
                  ₹{actualBalance.toFixed(2)}
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
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          }))}
        </TableBody>
      </Table>
      </div>
    </div>
  );
}
