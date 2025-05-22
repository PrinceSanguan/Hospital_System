import React, { useState } from "react";
import { useForm } from "@inertiajs/react";
import { 
  Search, 
  Trash, 
  FileText, 
  Download, 
  Plus, 
  Eye,
  Printer,
  CreditCard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import AdminLayout from '@/layouts/AdminLayout';
import { Link } from "@inertiajs/react";
import { Badge } from "@/components/ui/badge";

interface Patient {
  id: number;
  name: string;
  reference: string;
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
}

interface ReceiptItem {
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

interface ReceiptsProps {
  user: {
    name: string;
    email: string;
    role: string;
  };
  receipts: Receipt[];
}

export default function Receipts({ user, receipts }: ReceiptsProps) {
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const { delete: destroy, processing } = useForm();

  // Filter receipts based on search query
  const filteredReceipts = receipts.filter(receipt => {
    return (
      (receipt.receipt_number && receipt.receipt_number.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (receipt.patient?.name && receipt.patient.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (receipt.patient?.reference && receipt.patient.reference.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (receipt.payment_method && receipt.payment_method.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const confirmDelete = (receipt: Receipt) => {
    setSelectedReceipt(receipt);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (selectedReceipt) {
      destroy(route('admin.receipts.destroy', selectedReceipt.id), {
        onSuccess: () => {
          setIsDeleteDialogOpen(false);
          setSelectedReceipt(null);
        }
      });
    }
  };

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
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Receipt Management</h1>
            <p className="text-muted-foreground">Manage patient payment receipts</p>
          </div>
          <Button asChild>
            <Link href={route('admin.receipts.create')}>
              <Plus className="mr-2 h-4 w-4" /> Create Receipt
            </Link>
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6">
            <div className="flex items-center space-x-2 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search receipts by number, patient name or payment method..."
                  className="w-full pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="rounded-md border">
              <div className="relative overflow-x-auto">
                <table className="w-full text-sm text-left rtl:text-right">
                  <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3">Receipt #</th>
                      <th scope="col" className="px-6 py-3">Patient</th>
                      <th scope="col" className="px-6 py-3">Amount</th>
                      <th scope="col" className="px-6 py-3">Payment Method</th>
                      <th scope="col" className="px-6 py-3">Payment Date</th>
                      <th scope="col" className="px-6 py-3">Status</th>
                      <th scope="col" className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReceipts.length > 0 ? (
                      filteredReceipts.map((receipt) => (
                        <tr key={receipt.id} className="bg-white border-b hover:bg-gray-50">
                          <td className="px-6 py-4 font-medium">
                            {receipt.receipt_number}
                          </td>
                          <td className="px-6 py-4">
                            {receipt.patient ? (
                              <>
                                <div>{receipt.patient.name}</div>
                                <div className="text-xs text-gray-500">Ref: {receipt.patient.reference}</div>
                              </>
                            ) : "N/A"}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <CreditCard className="mr-2 h-4 w-4 text-gray-400" />
                              PHP {receipt.amount}
                            </div>
                          </td>
                          <td className="px-6 py-4">{receipt.payment_method}</td>
                          <td className="px-6 py-4">{receipt.payment_date}</td>
                          <td className="px-6 py-4">{getStatusBadge(receipt.status)}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    Actions
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem asChild>
                                    <Link href={route('admin.receipts.show', receipt.id)}>
                                      <Eye className="mr-2 h-4 w-4" />
                                      View Details
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild>
                                    <Link href={route('admin.receipts.print', receipt.id)} target="_blank">
                                      <Printer className="mr-2 h-4 w-4" />
                                      Print Receipt
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="text-red-600 focus:text-red-700" 
                                    onClick={() => confirmDelete(receipt)}
                                  >
                                    <Trash className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr className="bg-white border-b">
                        <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                          {searchQuery ? (
                            <>No receipts found matching your search criteria.</>
                          ) : (
                            <>No receipts have been created yet.</>
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Delete confirmation dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Deletion</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete receipt #{selectedReceipt?.receipt_number}? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
                disabled={processing}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={processing}
              >
                {processing ? "Deleting..." : "Delete Receipt"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
