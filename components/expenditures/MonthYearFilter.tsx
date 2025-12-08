'use client';

import { useMemo } from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CalendarDays } from 'lucide-react';

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

interface MonthYearFilterProps {
  selectedYear: number;
  selectedMonth: number;
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
  availableYears?: number[];
}

export default function MonthYearFilter({
  selectedYear,
  selectedMonth,
  onYearChange,
  onMonthChange,
  availableYears = [],
}: MonthYearFilterProps) {
  const years = useMemo(() => {
    // If availableYears provided, use them, otherwise generate recent years
    if (availableYears.length > 0) {
      return availableYears;
    }
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 5 }, (_, i) => currentYear - i);
  }, [availableYears]);

  return (
    <div className="bg-card border border-border rounded-xl p-5 mb-6 shadow-sm">
      <div className="flex items-center gap-4">
        <CalendarDays className="h-5 w-5 text-muted-foreground" />
        
        <div className="flex-1 grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="month-select" className="text-sm font-medium">Month</Label>
            <Select
              value={selectedMonth.toString()}
              onValueChange={(value) => onMonthChange(parseInt(value))}
            >
              <SelectTrigger id="month-select" className="h-9">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((month) => (
                  <SelectItem key={month.value} value={month.value.toString()}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="year-select" className="text-sm font-medium">Financial Year</Label>
            <Select
              value={selectedYear.toString()}
              onValueChange={(value) => onYearChange(parseInt(value))}
            >
              <SelectTrigger id="year-select" className="h-9">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}
