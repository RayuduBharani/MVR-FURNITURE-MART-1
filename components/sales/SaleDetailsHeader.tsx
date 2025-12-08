'use client';

import { ArrowLeft, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SaleDetailsHeaderProps {
  onBack: () => void;
  hasBalance: boolean;
  onAddPayment: () => void;
}

export default function SaleDetailsHeader({
  onBack,
  hasBalance,
  onAddPayment,
}: SaleDetailsHeaderProps) {
  return (
    <div className="flex items-center justify-between flex-wrap gap-4">
      <div className="flex items-center gap-3">
        <Button onClick={onBack} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Sales
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">Sale Details</h1>
      </div>
      {hasBalance && (
        <Button
          onClick={onAddPayment}
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
          size="lg"
        >
          <CreditCard className="h-5 w-5 mr-2" />
          Add Payment
        </Button>
      )}
    </div>
  );
}
