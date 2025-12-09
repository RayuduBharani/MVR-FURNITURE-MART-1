'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import SalesList from './SalesList';

interface PaymentHistory {
  date: string;
  amount: number;
  paymentType: string;
}

interface Sale {
  id: string;
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

interface SalesListWithFilterProps {
  sales: Sale[];
  expandedSale: string | null;
  onToggleExpand: (saleId: string) => void;
  onPayEMI: (sale: Sale) => void;
  onDownloadInvoice: (sale: Sale) => void;
}

export default function SalesListWithFilter({
  sales,
  expandedSale,
  onToggleExpand,
  onPayEMI,
  onDownloadInvoice,
}: SalesListWithFilterProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSales = sales.filter((sale) =>
    sale.customerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-3">
      {/* Search Filter */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Search by customer name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Sales List */}
      {filteredSales.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {searchQuery ? 'No customers found matching your search' : 'No sales found'}
        </div>
      ) : (
        <SalesList
          sales={filteredSales}
          expandedSale={expandedSale}
          onToggleExpand={onToggleExpand}
          onPayEMI={onPayEMI}
          onDownloadInvoice={onDownloadInvoice}
        />
      )}
    </div>
  );
}
