import React, { useState } from "react";
import { useForm, Link } from "@inertiajs/react";
import AdminLayout from '@/layouts/AdminLayout';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { ArrowLeft, Calendar, CreditCard, Plus, Trash } from "lucide-react";

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

interface ReceiptFormProps {
  user: {
    name: string;
    email: string;
    role: string;
  };
  patients: Patient[];
  paymentMethods: string[];
}

export default function ReceiptForm({ user, patients, paymentMethods }: ReceiptFormProps) {
  // Initialize with one empty receipt item
  const [items, setItems] = useState<ReceiptItem[]>([
    { description: '', quantity: 1, unit_price: 0, amount: 0 }
  ]);

  const { data, setData, post, processing, errors } = useForm({
    patient_id: "",
    appointment_id: "", // Optional
    payment_method: "",
    payment_date: new Date().toISOString().split('T')[0], // Default to today
    description: "",
    items: [] as ReceiptItem[],
    amount: 0,
  });

  // Update total amount whenever items change
  React.useEffect(() => {
    calculateTotal();
  }, [items]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Update the items in the form data before submitting
    setData('items', items);
    post(route('admin.receipts.store'));
  };

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unit_price: 0, amount: 0 }]);
  };

  const removeItem = (index: number) => {
    const updatedItems = [...items];
    updatedItems.splice(index, 1);
    setItems(updatedItems);
  };

  const updateItem = (index: number, field: keyof ReceiptItem, value: any) => {
    const updatedItems = [...items];
    updatedItems[index][field] = value;
    
    // Recalculate amount when quantity or unit_price changes
    if (field === 'quantity' || field === 'unit_price') {
      updatedItems[index].amount = 
        updatedItems[index].quantity * updatedItems[index].unit_price;
    }
    
    setItems(updatedItems);
  };

  const calculateTotal = () => {
    const total = items.reduce((sum, item) => sum + item.amount, 0);
    setData('amount', total);
    return total;
  };

  // Format today's date as YYYY-MM-DD for the date input min value
  const today = new Date().toISOString().split('T')[0];

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
              <h1 className="text-2xl font-bold tracking-tight">Create New Receipt</h1>
              <p className="text-muted-foreground">Generate a new payment receipt</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Receipt Information</CardTitle>
              <CardDescription>
                Fill in the details for the new payment receipt
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid gap-6">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <FormLabel htmlFor="patient_id">Patient</FormLabel>
                      <Select 
                        value={data.patient_id} 
                        onValueChange={value => setData('patient_id', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a patient" />
                        </SelectTrigger>
                        <SelectContent>
                          {patients.map(patient => (
                            <SelectItem key={patient.id} value={patient.id.toString()}>
                              {patient.name} (Ref: {patient.reference})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.patient_id && (
                        <p className="text-sm text-red-500">{errors.patient_id}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <FormLabel htmlFor="payment_method">Payment Method</FormLabel>
                      <Select 
                        value={data.payment_method} 
                        onValueChange={value => setData('payment_method', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment method" />
                        </SelectTrigger>
                        <SelectContent>
                          {paymentMethods.map(method => (
                            <SelectItem key={method} value={method}>
                              {method}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.payment_method && (
                        <p className="text-sm text-red-500">{errors.payment_method}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <FormLabel htmlFor="payment_date">Payment Date</FormLabel>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="payment_date"
                        type="date"
                        className="pl-9"
                        value={data.payment_date}
                        onChange={(e) => setData('payment_date', e.target.value)}
                      />
                    </div>
                    {errors.payment_date && (
                      <p className="text-sm text-red-500">{errors.payment_date}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <FormLabel htmlFor="description">Description (Optional)</FormLabel>
                    <Textarea
                      id="description"
                      value={data.description}
                      onChange={(e) => setData('description', e.target.value)}
                      placeholder="Additional notes about this payment"
                      rows={2}
                    />
                    {errors.description && (
                      <p className="text-sm text-red-500">{errors.description}</p>
                    )}
                  </div>

                  {/* Receipt Items */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <FormLabel>Receipt Items</FormLabel>
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm"
                        onClick={addItem}
                      >
                        <Plus className="mr-2 h-3 w-3" />
                        Add Item
                      </Button>
                    </div>

                    <div className="rounded-md border">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-xs font-medium uppercase text-gray-500">
                          <tr>
                            <th className="px-4 py-3 text-left">Description</th>
                            <th className="px-4 py-3 text-right">Quantity</th>
                            <th className="px-4 py-3 text-right">Unit Price</th>
                            <th className="px-4 py-3 text-right">Amount</th>
                            <th className="px-4 py-3 text-center w-20">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {items.map((item, index) => (
                            <tr key={index} className="bg-white">
                              <td className="px-4 py-3">
                                <Input
                                  type="text"
                                  placeholder="Item description"
                                  value={item.description}
                                  onChange={(e) => updateItem(index, 'description', e.target.value)}
                                />
                              </td>
                              <td className="px-4 py-3">
                                <Input
                                  type="number"
                                  min="1"
                                  className="text-right"
                                  value={item.quantity}
                                  onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value))}
                                />
                              </td>
                              <td className="px-4 py-3">
                                <Input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  className="text-right"
                                  value={item.unit_price}
                                  onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value))}
                                />
                              </td>
                              <td className="px-4 py-3 text-right font-medium">
                                PHP {item.amount.toFixed(2)}
                              </td>
                              <td className="px-4 py-3 text-center">
                                {items.length > 1 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeItem(index)}
                                  >
                                    <Trash className="h-4 w-4 text-red-500" />
                                  </Button>
                                )}
                              </td>
                            </tr>
                          ))}
                          <tr className="bg-gray-50 font-medium">
                            <td colSpan={3} className="px-4 py-3 text-right">
                              Total Amount:
                            </td>
                            <td className="px-4 py-3 text-right font-bold">
                              PHP {calculateTotal().toFixed(2)}
                            </td>
                            <td></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    {errors.items && (
                      <p className="text-sm text-red-500">{errors.items}</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => window.history.back()}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={processing}>
                    {processing ? "Creating..." : "Generate Receipt"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
