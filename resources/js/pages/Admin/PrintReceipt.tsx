import React, { useEffect } from "react";
import { CreditCard } from "lucide-react";

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

interface PrintReceiptProps {
  receipt: Receipt;
}

export default function PrintReceipt({ receipt }: PrintReceiptProps) {
  // Automatically trigger print when component mounts
  useEffect(() => {
    // Give a short delay to ensure the content is rendered before printing
    const timer = setTimeout(() => {
      window.print();
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  // Get current date for printing
  const currentDate = new Date().toLocaleDateString();
  return (
    <div className="bg-white p-8 max-w-3xl mx-auto print:p-0">
      {/* Print-specific styles */}
      <style>
        {`
          @media print {
            @page {
              size: A4;
              margin: 1cm;
            }
            html, body {
              font-size: 12pt;
              color: #000;
              background-color: #fff;
              height: 100%;
              margin: 0 !important;
              padding: 0 !important;
              width: 100%;
            }
            .print-header {
              border-bottom: 1px solid #000;
              padding-bottom: 1rem;
              margin-bottom: 1.5rem;
            }
            .print-footer {
              border-top: 1px solid #000;
              padding-top: 1rem;
              margin-top: 1.5rem;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            th, td {
              padding: 0.5rem;
              border-bottom: 1px solid #ddd;
            }
            th {
              background-color: #f3f4f6 !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              text-align: left;
            }
            .text-right {
              text-align: right;
            }
            .total-row {
              font-weight: bold;
              background-color: #f3f4f6 !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .no-print-button, .no-print {
              display: none !important;
            }
          }
        `}
      </style>

      {/* Receipt Content */}
      <div className="print-content">
        <div className="print-header flex justify-between items-center">
          <div>
            <h1 className="font-bold text-2xl">Hospital Management System</h1>
            <p className="text-gray-600">123 Main Street, City, Country</p>
            <p className="text-gray-600">Phone: (123) 456-7890 | Email: info@hospital.com</p>
          </div>
          <div className="text-right">
            <h2 className="font-bold text-xl">RECEIPT</h2>
            <p>#{receipt.receipt_number}</p>
            <p>Date: {receipt.payment_date}</p>
          </div>
        </div>

        {/* Patient Information */}
        <div className="mb-6">
          <h2 className="font-bold text-lg mb-2">Patient Information</h2>
          {receipt.patient ? (
            <div>
              <p><strong>Name:</strong> {receipt.patient.name}</p>
              <p><strong>Reference:</strong> {receipt.patient.reference}</p>
            </div>
          ) : (
            <p>No patient information</p>
          )}
        </div>

        {/* Payment Details */}
        <div className="mb-6">
          <h2 className="font-bold text-lg mb-2">Payment Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p><strong>Payment Method:</strong> {receipt.payment_method}</p>
            </div>
            <div>
              <p><strong>Status:</strong> {receipt.status}</p>
            </div>
          </div>
        </div>

        {/* Receipt Items */}
        <div className="mb-6">
          <h2 className="font-bold text-lg mb-2">Receipt Items</h2>
          <table className="w-full">
            <thead>
              <tr>
                <th>Description</th>
                <th className="text-right">Qty</th>
                <th className="text-right">Unit Price</th>
                <th className="text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {receipt.items && receipt.items.length > 0 ? (
                receipt.items.map((item, index) => (                  <tr key={index}>
                    <td>{item.description}</td>
                    <td className="text-right">{item.quantity}</td>
                    <td className="text-right">PHP {typeof item.unit_price === 'number' ? item.unit_price.toFixed(2) : item.unit_price}</td>
                    <td className="text-right">PHP {typeof item.amount === 'number' ? item.amount.toFixed(2) : item.amount}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="text-center">No items found</td>
                </tr>
              )}
              <tr className="total-row">
                <td colSpan={3} className="text-right">
                  Total Amount:
                </td>
                <td className="text-right">
                  PHP {receipt.amount}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Print Footer */}
        <div className="print-footer">
          <div className="text-center mb-6">
            <p><strong>Thank you!</strong></p>
            <p className="text-gray-600">This is a computer generated receipt and does not require a signature.</p>
          </div>
          
          <div className="grid grid-cols-2">
            <div>
              <p><strong>Printed On:</strong> {currentDate}</p>
            </div>
            <div className="text-right">
              <p><strong>Receipt ID:</strong> {receipt.receipt_number}</p>
            </div>
          </div>
        </div>
      </div>      {/* Print and Back Buttons (only visible in browser, not when printing) */}
      <div className="mt-6 flex justify-center gap-4 no-print">
        <button 
          onClick={() => window.print()} 
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded flex items-center justify-center mx-auto no-print-button"
        >
          <CreditCard className="mr-2 h-4 w-4" /> Print Receipt
        </button>
        <button 
          onClick={() => window.history.back()} 
          className="bg-gray-600 hover:bg-gray-700 text-white py-2 px-6 rounded flex items-center justify-center mx-auto no-print-button"
        >
          Back to Receipt
        </button>
      </div>
    </div>
  );
}
