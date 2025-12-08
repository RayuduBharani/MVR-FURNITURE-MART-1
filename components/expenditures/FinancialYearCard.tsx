'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Calendar } from 'lucide-react';
import type { FinancialYearSummary } from '@/actions/financial-year-actions';

interface FinancialYearCardProps {
  summary: FinancialYearSummary;
}

export default function FinancialYearCard({ summary }: FinancialYearCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const maxAmount = Math.max(...summary.monthlyBreakdown.map(m => m.amount), 1);

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">
              Financial Year {summary.financialYear}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TrendingUp className="h-4 w-4" />
            <span>April - March</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total Summary */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-1">Total Annual Expenditure</p>
          <p className="text-2xl font-bold text-primary">
            {formatCurrency(summary.totalAmount)}
          </p>
        </div>

        {/* Monthly Breakdown */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground mb-3">Monthly Breakdown</p>
          <div className="space-y-2">
            {summary.monthlyBreakdown.map((month) => (
              <div key={`${month.year}-${month.month}`} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    {month.monthName} {month.year}
                  </span>
                  <span className="font-semibold">
                    {month.amount > 0 ? formatCurrency(month.amount) : '—'}
                  </span>
                </div>
                {/* Progress Bar */}
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${(month.amount / maxAmount) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
