'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, TrendingUp, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AddExpenditureDialog from '@/components/expenditures/AddExpenditureDialog';
import MonthYearFilter from '@/components/expenditures/MonthYearFilter';
import ExpendituresList from '@/components/expenditures/ExpendituresList';
import FinancialYearCard from '@/components/expenditures/FinancialYearCard';
import {
  getExpendituresByMonth,
  type ExpenditureData,
} from '@/actions/expenditure-actions';
import {
  getAvailableFinancialYears,
  getFinancialYearSummary,
  type FinancialYearSummary,
} from '@/actions/financial-year-actions';

export default function ExpendituresPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [fyLoading, setFyLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [expenditures, setExpenditures] = useState<ExpenditureData[]>([]);
  const [monthlyTotal, setMonthlyTotal] = useState(0);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [fySummary, setFySummary] = useState<FinancialYearSummary | null>(null);
  
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();
  const defaultFY = currentMonth < 4 ? currentYear - 1 : currentYear;
  
  const [selectedYear, setSelectedYear] = useState(defaultFY);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [activeTab, setActiveTab] = useState('monthly');

  // Fetch available financial years on mount
  useEffect(() => {
    const fetchYears = async () => {
      const result = await getAvailableFinancialYears();
      if (result.success && result.data) {
        setAvailableYears(result.data);
      }
    };
    fetchYears();
  }, []);

  // Fetch financial year summary when year changes
  useEffect(() => {
    if (activeTab === 'yearly') {
      fetchFinancialYearSummary();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedYear, activeTab]);

  const fetchFinancialYearSummary = async () => {
    setFyLoading(true);
    try {
      const result = await getFinancialYearSummary(selectedYear);
      if (result.success && result.data) {
        setFySummary(result.data);
      } else {
        setFySummary(null);
      }
    } catch {
      setFySummary(null);
    } finally {
      setFyLoading(false);
    }
  };

  const fetchExpenditures = useCallback(async () => {
    setLoading(true);
    setError('');
    
    try {
      const result = await getExpendituresByMonth(selectedYear, selectedMonth);
      
      if (result.success && result.data) {
        setExpenditures(result.data.expenditures);
        setMonthlyTotal(result.data.totalAmount);
      } else {
        setError(result.error || 'Failed to fetch expenditures');
        setExpenditures([]);
        setMonthlyTotal(0);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setExpenditures([]);
      setMonthlyTotal(0);
    } finally {
      setLoading(false);
    }
  }, [selectedYear, selectedMonth]);

  // Fetch expenditures when month/year changes
  useEffect(() => {
    if (activeTab === 'monthly') {
      fetchExpenditures();
    }
  }, [fetchExpenditures, activeTab]);

  const handleExpenditureAdded = () => {
    if (activeTab === 'monthly') {
      fetchExpenditures();
    }
    if (activeTab === 'yearly') {
      fetchFinancialYearSummary();
    }
    // Refresh available years in case new year was added
    getAvailableFinancialYears().then((result) => {
      if (result.success && result.data) {
        setAvailableYears(result.data);
      }
    });
  };

  const handleExpenditureDeleted = () => {
    if (activeTab === 'monthly') {
      fetchExpenditures();
    }
    if (activeTab === 'yearly') {
      fetchFinancialYearSummary();
    }
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Expenditures</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track and manage shop expenses (Financial Year: April - March)
          </p>
        </div>
        <AddExpenditureDialog onSuccess={handleExpenditureAdded} />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="monthly">Monthly View</TabsTrigger>
          <TabsTrigger value="yearly" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Annual Summary
          </TabsTrigger>
        </TabsList>

        {/* Monthly View */}
        <TabsContent value="monthly" className="space-y-6">
          {/* Month & Year Filter */}
          <MonthYearFilter
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            onYearChange={setSelectedYear}
            onMonthChange={setSelectedMonth}
            availableYears={availableYears}
          />

          {/* Error Alert */}
          {error && (
            <div className="bg-destructive/15 border border-destructive/30 text-destructive px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
            </div>
          ) : (
            /* Expenditures List */
            <ExpendituresList
              expenditures={expenditures}
              totalAmount={monthlyTotal}
              onDelete={handleExpenditureDeleted}
            />
          )}
        </TabsContent>

        {/* Yearly View */}
        <TabsContent value="yearly" className="space-y-6">
          {/* Year Selector */}
          <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium mb-1">Select Financial Year</h3>
                <p className="text-sm text-muted-foreground">
                  View annual expenditure summary from April to March
                </p>
              </div>
              <div className="flex items-center gap-2">
                {availableYears.slice(0, 5).map((year) => (
                  <Button
                    key={year}
                    variant={selectedYear === year ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedYear(year)}
                  >
                    FY {year}-{(year + 1).toString().slice(-2)}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Financial Year Summary */}
          {fyLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
            </div>
          ) : fySummary ? (
            <FinancialYearCard summary={fySummary} />
          ) : (
            <div className="text-center py-16">
              <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground/40" />
              <h3 className="mt-4 text-base font-medium text-foreground">No data available</h3>
              <p className="text-sm text-muted-foreground mt-1">
                No expenditures recorded for this financial year.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
