'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft,
  CalendarIcon,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  getDailyReport,
  getMonthlyReport,
  getYearlyReport,
  getFinancialYearReport,
  type DailyReport,
  type MonthlyReport,
  type YearlyReport,
  type FinancialYearReport,
} from '@/actions/report-actions';

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

export default function ReportsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('daily');

  // Date/Period Selection
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();
  const currentFY = currentMonth < 4 ? currentYear - 1 : currentYear;

  const [selectedDate, setSelectedDate] = useState<Date>(currentDate);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedFY, setSelectedFY] = useState(currentFY);

  // Reports Data
  const [dailyReport, setDailyReport] = useState<DailyReport | null>(null);
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReport | null>(null);
  const [yearlyReport, setYearlyReport] = useState<YearlyReport | null>(null);
  const [fyReport, setFYReport] = useState<FinancialYearReport | null>(null);

  // Generate year options
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  const fetchDailyReport = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getDailyReport(selectedDate);
      if (result.success && result.data) {
        setDailyReport(result.data);
      } else {
        setDailyReport(null);
      }
    } catch {
      setDailyReport(null);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  const fetchMonthlyReport = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getMonthlyReport(selectedYear, selectedMonth);
      if (result.success && result.data) {
        setMonthlyReport(result.data);
      } else {
        setMonthlyReport(null);
      }
    } catch {
      setMonthlyReport(null);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, selectedYear]);

  const fetchYearlyReport = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getYearlyReport(selectedYear);
      if (result.success && result.data) {
        setYearlyReport(result.data);
      } else {
        setYearlyReport(null);
      }
    } catch {
      setYearlyReport(null);
    } finally {
      setLoading(false);
    }
  }, [selectedYear]);

  const fetchFYReport = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getFinancialYearReport(selectedFY);
      if (result.success && result.data) {
        setFYReport(result.data);
      } else {
        setFYReport(null);
      }
    } catch {
      setFYReport(null);
    } finally {
      setLoading(false);
    }
  }, [selectedFY]);

  useEffect(() => {
    if (activeTab === 'daily') {
      fetchDailyReport();
    }
  }, [fetchDailyReport, activeTab]);

  useEffect(() => {
    if (activeTab === 'monthly') {
      fetchMonthlyReport();
    }
  }, [fetchMonthlyReport, activeTab]);

  useEffect(() => {
    if (activeTab === 'yearly') {
      fetchYearlyReport();
    }
  }, [fetchYearlyReport, activeTab]);

  useEffect(() => {
    if (activeTab === 'financial') {
      fetchFYReport();
    }
  }, [fetchFYReport, activeTab]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push('/')}
        className="mb-4 -ml-2"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Home
      </Button>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-foreground">Financial Reports</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Comprehensive sales and expenditure reports
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-2xl grid-cols-4">
          <TabsTrigger value="daily">Daily</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="yearly">Yearly</TabsTrigger>
          <TabsTrigger value="financial">Financial Year</TabsTrigger>
        </TabsList>

        {/* Daily Report */}
        <TabsContent value="daily" className="space-y-6">
          <Card className="shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium mb-1">Select Date</h3>
                  <p className="text-sm text-muted-foreground">
                    View daily financial summary
                  </p>
                </div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-[280px] justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(selectedDate, 'PPP')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </CardContent>
          </Card>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
            </div>
          ) : dailyReport ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Sales
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(dailyReport.totalSales)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {dailyReport.salesCount} {dailyReport.salesCount === 1 ? 'transaction' : 'transactions'}
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Expenditures
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {formatCurrency(dailyReport.totalExpenditures)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {dailyReport.expendituresCount} {dailyReport.expendituresCount === 1 ? 'expense' : 'expenses'}
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-2 border-primary">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    {dailyReport.profit >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    )}
                    Net Profit/Loss
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${dailyReport.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(dailyReport.profit)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {dailyReport.profit >= 0 ? 'Profit' : 'Loss'} for the day
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-16">
              <DollarSign className="mx-auto h-12 w-12 text-muted-foreground/40" />
              <h3 className="mt-4 text-base font-medium text-foreground">No data available</h3>
              <p className="text-sm text-muted-foreground mt-1">
                No transactions recorded for this date.
              </p>
            </div>
          )}
        </TabsContent>

        {/* Monthly Report */}
        <TabsContent value="monthly" className="space-y-6">
          <Card className="shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium mb-1">Select Month & Year</h3>
                  <p className="text-sm text-muted-foreground">
                    View monthly financial summary
                  </p>
                </div>
                <div className="flex gap-3">
                  <Select
                    value={selectedMonth.toString()}
                    onValueChange={(value) => setSelectedMonth(parseInt(value))}
                  >
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map((month) => (
                        <SelectItem key={month.value} value={month.value.toString()}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={selectedYear.toString()}
                    onValueChange={(value) => setSelectedYear(parseInt(value))}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Year" />
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
            </CardContent>
          </Card>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
            </div>
          ) : monthlyReport ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Sales
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(monthlyReport.totalSales)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {monthlyReport.salesCount} transactions
                    </p>
                  </CardContent>
                </Card>

                <Card className="shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Expenditures
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {formatCurrency(monthlyReport.totalExpenditures)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {monthlyReport.expendituresCount} expenses
                    </p>
                  </CardContent>
                </Card>

                <Card className="shadow-sm border-2 border-primary">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      {monthlyReport.profit >= 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      )}
                      Net Profit/Loss
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${monthlyReport.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(monthlyReport.profit)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {monthlyReport.monthName} {monthlyReport.year}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {monthlyReport.dailyBreakdown.length > 0 && (
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle>Daily Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50 hover:bg-muted/50">
                            <TableHead className="font-medium">Date</TableHead>
                            <TableHead className="text-right font-medium">Sales</TableHead>
                            <TableHead className="text-right font-medium">Expenditures</TableHead>
                            <TableHead className="text-right font-medium">Profit/Loss</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {monthlyReport.dailyBreakdown.map((day) => (
                            <TableRow key={day.date}>
                              <TableCell className="font-medium">
                                {format(new Date(day.date), 'dd MMM yyyy')}
                              </TableCell>
                              <TableCell className="text-right text-green-600 font-semibold">
                                {formatCurrency(day.totalSales)}
                              </TableCell>
                              <TableCell className="text-right text-red-600 font-semibold">
                                {formatCurrency(day.totalExpenditures)}
                              </TableCell>
                              <TableCell className={`text-right font-semibold ${day.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(day.profit)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <DollarSign className="mx-auto h-12 w-12 text-muted-foreground/40" />
              <h3 className="mt-4 text-base font-medium text-foreground">No data available</h3>
              <p className="text-sm text-muted-foreground mt-1">
                No transactions recorded for this month.
              </p>
            </div>
          )}
        </TabsContent>

        {/* Yearly Report */}
        <TabsContent value="yearly" className="space-y-6">
          <Card className="shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium mb-1">Select Year</h3>
                  <p className="text-sm text-muted-foreground">
                    View yearly financial summary (Calendar Year)
                  </p>
                </div>
                <Select
                  value={selectedYear.toString()}
                  onValueChange={(value) => setSelectedYear(parseInt(value))}
                >
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Year" />
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
            </CardContent>
          </Card>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
            </div>
          ) : yearlyReport ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Sales
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(yearlyReport.totalSales)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {yearlyReport.salesCount} transactions
                    </p>
                  </CardContent>
                </Card>

                <Card className="shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Expenditures
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {formatCurrency(yearlyReport.totalExpenditures)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {yearlyReport.expendituresCount} expenses
                    </p>
                  </CardContent>
                </Card>

                <Card className="shadow-sm border-2 border-primary">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      {yearlyReport.profit >= 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      )}
                      Net Profit/Loss
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${yearlyReport.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(yearlyReport.profit)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Year {yearlyReport.year}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {yearlyReport.monthlyBreakdown.length > 0 && (
                <Card className="shadow-sm">
                  <CardHeader>
                    <CardTitle>Monthly Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50 hover:bg-muted/50">
                            <TableHead className="font-medium">Month</TableHead>
                            <TableHead className="text-right font-medium">Sales</TableHead>
                            <TableHead className="text-right font-medium">Expenditures</TableHead>
                            <TableHead className="text-right font-medium">Profit/Loss</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {yearlyReport.monthlyBreakdown.map((month) => (
                            <TableRow key={`${month.year}-${month.month}`}>
                              <TableCell className="font-medium">
                                {month.monthName} {month.year}
                              </TableCell>
                              <TableCell className="text-right text-green-600 font-semibold">
                                {formatCurrency(month.totalSales)}
                              </TableCell>
                              <TableCell className="text-right text-red-600 font-semibold">
                                {formatCurrency(month.totalExpenditures)}
                              </TableCell>
                              <TableCell className={`text-right font-semibold ${month.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {formatCurrency(month.profit)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <DollarSign className="mx-auto h-12 w-12 text-muted-foreground/40" />
              <h3 className="mt-4 text-base font-medium text-foreground">No data available</h3>
              <p className="text-sm text-muted-foreground mt-1">
                No transactions recorded for this year.
              </p>
            </div>
          )}
        </TabsContent>

        {/* Financial Year Report */}
        <TabsContent value="financial" className="space-y-6">
          <Card className="shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium mb-1">Select Financial Year</h3>
                  <p className="text-sm text-muted-foreground">
                    View financial year summary (April - March)
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {years.slice(0, 5).map((year) => (
                    <Button
                      key={year}
                      variant={selectedFY === year ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedFY(year)}
                    >
                      FY {year}-{(year + 1).toString().slice(-2)}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
            </div>
          ) : fyReport ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Sales
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(fyReport.totalSales)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {fyReport.salesCount} transactions
                    </p>
                  </CardContent>
                </Card>

                <Card className="shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Total Expenditures
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-red-600">
                      {formatCurrency(fyReport.totalExpenditures)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {fyReport.expendituresCount} expenses
                    </p>
                  </CardContent>
                </Card>

                <Card className="shadow-sm border-2 border-primary">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      {fyReport.profit >= 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      )}
                      Net Profit/Loss
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-2xl font-bold ${fyReport.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(fyReport.profit)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      FY {fyReport.financialYear}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card className="shadow-sm">
                <CardHeader>
                  <CardTitle>Monthly Breakdown (April - March)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50 hover:bg-muted/50">
                          <TableHead className="font-medium">Month</TableHead>
                          <TableHead className="text-right font-medium">Sales</TableHead>
                          <TableHead className="text-right font-medium">Expenditures</TableHead>
                          <TableHead className="text-right font-medium">Profit/Loss</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {fyReport.monthlyBreakdown.map((month) => (
                          <TableRow key={`${month.year}-${month.month}`}>
                            <TableCell className="font-medium">
                              {month.monthName} {month.year}
                            </TableCell>
                            <TableCell className="text-right text-green-600 font-semibold">
                              {formatCurrency(month.totalSales)}
                            </TableCell>
                            <TableCell className="text-right text-red-600 font-semibold">
                              {formatCurrency(month.totalExpenditures)}
                            </TableCell>
                            <TableCell className={`text-right font-semibold ${month.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(month.profit)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="text-center py-16">
              <DollarSign className="mx-auto h-12 w-12 text-muted-foreground/40" />
              <h3 className="mt-4 text-base font-medium text-foreground">No data available</h3>
              <p className="text-sm text-muted-foreground mt-1">
                No transactions recorded for this financial year.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
