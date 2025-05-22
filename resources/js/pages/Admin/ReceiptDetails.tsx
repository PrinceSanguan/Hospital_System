import React from "react";
import { Link } from "@inertiajs/react";
import AdminLayout from '@/layouts/AdminLayout';
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { ArrowLeft, Printer, CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Patient {
  id: number;
  name: string;
  reference: string;
}

interface ReceiptItem {
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

interface Receipt {
  id: number;
  receipt_number: string;
  patient: Patient | null;
  amount: string;
  payment_method: string;
  payment_date: string;
  status: string;
  items: ReceiptItem[];
  created_at: string;
}

interface ReceiptDetailsProps {
  user: {
    name: string;
    email: string;
    role: string;
  };
  receipt: Receipt;
}

export default function ReceiptDetails({ user, receipt }: ReceiptDetailsProps) {
  // Function to get appropriate status badge color
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return <Badge variant="success" className="capitalize">{status}</Badge>;
      case 'pending':
        return <Badge variant="warning" className="capitalize">{status}</Badge>;
      case 'cancelled':
        return <Badge variant="destructive" className="capitalize">{status}</Badge>;
      default:
        return <Badge variant="outline" className="capitalize">{status}</Badge>;
    }
  };

  return (
    <AdminLayout user={user}>
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" asChild>
              <Link href={route('admin.receipts')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Receipts
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Receipt Details</h1>
              <p className="text-muted-foreground">Receipt #{receipt.receipt_number}</p>
            </div>
          </div>

          <Button asChild>
            <Link href={route('admin.receipts.print', receipt.id)} target="_blank">
              <Printer className="mr-2 h-4 w-4" />
              Print Receipt
            </Link>
          </Button>
        </div>

        <div className="grid gap-6">
          {/* Receipt Header */}
          <Card>
            <CardHeader>
              <CardTitle>Receipt Information</CardTitle>
              <CardDescription>
                Payment details and status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Receipt Number</p>
                  <p className="text-base font-semibold">{receipt.receipt_number}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">Payment Date</p>
                  <p className="text-base">{receipt.payment_date}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <div className="pt-1">{getStatusBadge(receipt.status)}</div>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">Payment Method</p>
                  <p className="text-base">{receipt.payment_method}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Amount</p>
                  <p className="text-base font-semibold flex items-center">
                    <CreditCard className="mr-1 h-4 w-4 text-muted-foreground" />
                    PHP {receipt.amount}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">Created On</p>
                  <p className="text-base">{receipt.created_at}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Patient Information */}
          {receipt.patient && (
            <Card>
              <CardHeader>
                <CardTitle>Patient Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Patient Name</p>
                    <p className="text-base font-semibold">{receipt.patient.name}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Patient Reference</p>
                    <p className="text-base">{receipt.patient.reference}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Receipt Items */}
          <Card>
            <CardHeader>
              <CardTitle>Receipt Items</CardTitle>
              <CardDescription>
                Items and services included in this receipt
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs font-medium uppercase text-gray-500">
                    <tr>
                      <th className="px-4 py-3 text-left">Description</th>
                      <th className="px-4 py-3 text-right">Quantity</th>
                      <th className="px-4 py-3 text-right">Unit Price</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {receipt.items && receipt.items.length > 0 ? (
                      receipt.items.map((item, index) => (
                        <tr key={index} className="bg-white">
                          <td className="px-4 py-3">{item.description}</td>
                          <td className="px-4 py-3 text-right">{item.quantity}</td>
                          <td className="px-4 py-3 text-right">PHP {item.unit_price.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right font-medium">PHP {item.amount.toFixed(2)}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-4 py-3 text-center">No items found</td>
                      </tr>
                    )}
                    <tr className="bg-gray-50 font-medium">
                      <td colSpan={3} className="px-4 py-3 text-right">
                        Total Amount:
                      </td>
                      <td className="px-4 py-3 text-right font-bold">
                        PHP {receipt.amount}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
