'use client';

import { Download, CreditCard } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface SaleActionsCardProps {
  hasBalance: boolean;
  onDownloadInvoice: () => void;
  onMakePayment: () => void;
}

export default function SaleActionsCard({
  hasBalance,
  onDownloadInvoice,
  onMakePayment,
}: SaleActionsCardProps) {
  return (
    <Card className="p-6 bg-white shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>
      <div className="flex gap-3 flex-wrap">
        <Button onClick={onDownloadInvoice} variant="outline" className="flex-1">
          <Download className="h-4 w-4 mr-2" />
          Download Invoice
        </Button>
        {hasBalance && (
          <Button
            onClick={onMakePayment}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Make Payment
          </Button>
        )}
      </div>
    </Card>
  );
}
