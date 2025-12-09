'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Trash2, FileText } from 'lucide-react';
import { deleteExpenditure, type ExpenditureData } from '@/actions/expenditure-actions';

interface ExpendituresListProps {
  expenditures: ExpenditureData[];
  totalAmount: number;
  onDelete: () => void;
}

export default function ExpendituresList({
  expenditures,
  totalAmount,
  onDelete,
}: ExpendituresListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const result = await deleteExpenditure(id);
      if (result.success) {
        onDelete();
      } else {
        alert(result.error || 'Failed to delete expenditure');
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (expenditures.length === 0) {
    return (
      <div className="text-center py-16">
        <FileText className="mx-auto h-12 w-12 text-muted-foreground/40" />
        <h3 className="mt-4 text-base font-medium text-foreground">No expenditures found</h3>
        <p className="text-sm text-muted-foreground mt-1">
          No expenditures recorded for the selected month and year.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Total Summary Card */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Total Expenditure</p>
            <p className="text-3xl font-semibold text-foreground">
              {formatCurrency(totalAmount)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground mb-1">Entries</p>
            <p className="text-2xl font-semibold text-foreground">
              {expenditures.length}
            </p>
          </div>
        </div>
      </div>

      {/* Expenditures Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="font-medium">Date & Time</TableHead>
                <TableHead className="font-medium">Category</TableHead>
                <TableHead className="font-medium">Notes</TableHead>
                <TableHead className="text-right font-medium">Amount</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenditures.map((expenditure) => (
                <TableRow key={expenditure.id}>
                  <TableCell className="font-medium">
                    {formatDate(expenditure.date)}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-secondary text-secondary-foreground">
                      {expenditure.category}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-[300px]">
                    {expenditure.notes ? (
                      <span className="text-sm text-muted-foreground">
                        {expenditure.notes}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground/50">
                        —
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(expenditure.amount)}
                  </TableCell>
                  <TableCell>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={deletingId === expenditure.id}
                          className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Expenditure</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this expenditure?
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(expenditure.id)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
