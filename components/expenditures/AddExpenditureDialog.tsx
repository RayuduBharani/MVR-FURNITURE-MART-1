'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Loader2 } from 'lucide-react';
import { createExpenditure } from '@/actions/expenditure-actions';

const EXPENDITURE_CATEGORIES = [
  'Salary',
  'Shop Maintenance',
  'Electricity',
  'Water',
  'Internet',
  'Rent',
  'Transportation',
  'Marketing',
  'Office Supplies',
  'Other Expenses',
];

interface AddExpenditureDialogProps {
  onSuccess: () => void;
}

export default function AddExpenditureDialog({ onSuccess }: AddExpenditureDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');

  const resetForm = () => {
    setCategory('');
    setAmount('');
    setNotes('');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Validation
    if (!category || category.trim() === '') {
      setError('Please select a category');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum < 1) {
      setError('Amount must be at least 1');
      return;
    }

    setLoading(true);

    try {
      const result = await createExpenditure({
        category: category.trim(),
        amount: amountNum,
        notes: notes.trim(),
      });

      if (result.success) {
        resetForm();
        setOpen(false);
        onSuccess();
      } else {
        setError(result.error || 'Failed to create expenditure');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Expenditure
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Add New Expenditure</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          {error && (
            <div className="bg-destructive/15 border border-destructive/30 text-destructive px-3 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="category" className="text-sm font-medium">
              Category <span className="text-red-500">*</span>
            </Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {EXPENDITURE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="amount" className="text-sm font-medium">
              Amount (₹) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="amount"
              type="number"
              min="1"
              step="0.01"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className="h-9"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-sm font-medium">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
              className="h-9"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="h-9">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Expenditure'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
