"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CalendarIcon, Loader2, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { addPayment, getPaymentsByPurchase, type PaymentData } from "@/actions/payment-actions";
import { PurchaseListItem } from "@/actions/purchase-actions";

interface PendingBillPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchaseId: string;
  purchase?: PurchaseListItem;
  onSuccess: () => void;
}

export function PendingBillPaymentDialog({
  open,
  onOpenChange,
  purchaseId,
  purchase,
  onSuccess,
}: PendingBillPaymentDialogProps) {
  const [amount, setAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState<Date>(new Date());
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState<PaymentData[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  const loadPaymentHistory = async () => {
    setLoadingHistory(true);
    try {
      const result = await getPaymentsByPurchase(purchaseId);
      if (result.success && result.data) {
        setPaymentHistory(result.data);
      }
    } catch (err) {
      console.error("Failed to load payment history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (open && purchaseId) {
      loadPaymentHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, purchaseId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    const paymentAmount = parseFloat(amount);

    if (!paymentAmount || paymentAmount <= 0) {
      setError("Please enter a valid payment amount");
      return;
    }

    if (purchase && paymentAmount > purchase.pendingAmount) {
      setError(`Payment amount cannot exceed pending amount of ₹${purchase.pendingAmount.toFixed(2)}`);
      return;
    }

    setLoading(true);

    try {
      const result = await addPayment({
        purchaseId,
        amount: paymentAmount,
        paymentDate,
        paymentMethod,
        notes: notes.trim() || undefined,
      });

      if (result.success) {
        setSuccess(true);
        setAmount("");
        setNotes("");
        setPaymentMethod("cash");
        setTimeout(() => {
          onSuccess();
        }, 1500);
      } else {
        setError(result.error || "Failed to add payment");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setAmount("");
      setNotes("");
      setError("");
      setSuccess(false);
      setPaymentMethod("cash");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Make Payment</DialogTitle>
          <DialogDescription>
            Add a payment for this pending purchase bill
          </DialogDescription>
        </DialogHeader>

        {purchase && (
          <div className="space-y-4">
            {/* Purchase Summary */}
            <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Product</span>
                <span className="font-semibold">{purchase.productName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Supplier</span>
                <span className="font-medium">{purchase.supplierName}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Total Amount</span>
                <span className="font-semibold">₹{purchase.total.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Paid Amount</span>
                <span className="font-semibold text-green-600">₹{purchase.paidAmount.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">Pending Amount</span>
                <span className="font-bold text-destructive text-lg">₹{purchase.pendingAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Payment History */}
            {!loadingHistory && paymentHistory.length > 0 && (
              <div className="rounded-lg border bg-card p-4">
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Payment History
                </h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {paymentHistory.map((payment) => (
                    <div
                      key={payment._id}
                      className="flex items-center justify-between text-sm p-2 rounded bg-muted/50"
                    >
                      <div>
                        <div className="font-medium">₹{payment.amount.toFixed(2)}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(payment.paymentDate).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                      </div>
                      {payment.paymentMethod && (
                        <Badge variant="outline" className="text-xs">
                          {payment.paymentMethod}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Payment Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Payment Amount *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={purchase.pendingAmount}
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  disabled={loading || success}
                />
                <p className="text-xs text-muted-foreground">
                  Maximum: ₹{purchase.pendingAmount.toFixed(2)}
                </p>
              </div>

              <div className="space-y-2">
                <Label>Payment Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                      disabled={loading || success}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(paymentDate, "PPP")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={paymentDate}
                      onSelect={(date) => date && setPaymentDate(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select
                  value={paymentMethod}
                  onValueChange={setPaymentMethod}
                  disabled={loading || success}
                >
                  <SelectTrigger id="paymentMethod">
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any notes about this payment..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  disabled={loading || success}
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-200 bg-green-50 text-green-900">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <AlertDescription>Payment added successfully!</AlertDescription>
                </Alert>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={loading || success}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {success ? "Payment Added" : "Add Payment"}
                </Button>
              </DialogFooter>
            </form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
