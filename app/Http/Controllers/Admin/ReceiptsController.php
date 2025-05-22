<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Receipt;
use App\Models\Patient;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class ReceiptsController extends Controller
{
    public function index()
    {
        $user = Auth::user();        // Get all receipts with patient information
        $receipts = Receipt::with('patient')->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($receipt) {
                return [
                    'id' => $receipt->id,
                    'receipt_number' => $receipt->receipt_number,
                    'patient' => $receipt->patient ? [
                        'id' => $receipt->patient->id,
                        'name' => $receipt->patient->name,
                        'reference' => $receipt->patient->reference_number,
                    ] : null,
                    'amount' => number_format($receipt->amount, 2),
                    'payment_method' => $receipt->payment_method,
                    'payment_date' => Carbon::parse($receipt->payment_date)->format('m/d/Y'),
                    'status' => $receipt->status ?? 'completed',
                    'items' => $receipt->items ? json_decode($receipt->items) : [],
                ];
            });

        return Inertia::render('Admin/Receipts', [
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->user_role,
            ],
            'receipts' => $receipts,
        ]);
    }    public function store(Request $request)
    {
        $request->validate([
            'patient_id' => 'required|exists:patients,id',
            'appointment_id' => 'nullable|exists:appointments,id',
            'amount' => 'required|numeric|min:0',
            'payment_method' => 'required|string',
            'payment_date' => 'required|date',
            'items' => 'required|json',
        ]);

        // Parse the items JSON
        $items = json_decode($request->items, true);

        // Validate items format
        if (!is_array($items) || empty($items)) {
            return redirect()->back()->withErrors(['items' => 'At least one item is required'])->withInput();
        }

        // Recalculate total to ensure it matches items
        $calculatedTotal = 0;
        $itemDescriptions = [];

        foreach ($items as $item) {
            if (!isset($item['description']) || !isset($item['quantity']) || !isset($item['unit_price']) || !isset($item['amount'])) {
                return redirect()->back()->withErrors(['items' => 'Invalid item format'])->withInput();
            }

            // Validate item values
            if (empty($item['description']) || $item['quantity'] <= 0 || $item['unit_price'] < 0) {
                return redirect()->back()->withErrors(['items' => 'Invalid item values'])->withInput();
            }

            $calculatedTotal += $item['amount'];
            $itemDescriptions[] = $item['description'];
        }

        // Check if calculated total matches the provided total (with a small tolerance for floating point errors)
        if (abs($calculatedTotal - (float)$request->amount) > 0.01) {
            return redirect()->back()->withErrors(['amount' => 'Total amount does not match item totals'])->withInput();
        }

        // Generate receipt number
        $receiptNumber = Receipt::generateReceiptNumber();

        // Create a combined description from item descriptions
        $description = implode(', ', $itemDescriptions);

        // Create receipt
        $receipt = Receipt::create([
            'receipt_number' => $receiptNumber,
            'patient_id' => $request->patient_id,
            'appointment_id' => $request->appointment_id,
            'amount' => $request->amount,
            'payment_method' => $request->payment_method,
            'payment_date' => $request->payment_date,
            'description' => $description,
            'status' => 'completed',
            'created_by' => Auth::id(),
            'items' => $request->items, // Store the raw JSON
        ]);

        return redirect()->route('admin.receipts')->with('success', 'Receipt created successfully');
    }

    public function show($id)
    {        $receipt = Receipt::with('patient')->findOrFail($id);
        
        $formattedReceipt = [
            'id' => $receipt->id,
            'receipt_number' => $receipt->receipt_number,
            'patient' => $receipt->patient ? [
                'id' => $receipt->patient->id,
                'name' => $receipt->patient->name,
                'reference' => $receipt->patient->reference_number,
            ] : null,
            'amount' => number_format($receipt->amount, 2),
            'payment_method' => $receipt->payment_method,
            'payment_date' => Carbon::parse($receipt->payment_date)->format('m/d/Y'),
            'items' => $receipt->items ? json_decode($receipt->items) : [],
            'status' => $receipt->status ?? 'completed',
            'created_at' => Carbon::parse($receipt->created_at)->format('m/d/Y h:i A'),
        ];

        return Inertia::render('Admin/ReceiptDetails', [
            'user' => [
                'name' => Auth::user()->name,
                'email' => Auth::user()->email,
                'role' => Auth::user()->user_role,
            ],
            'receipt' => $formattedReceipt,
        ]);
    }    public function create()
    {
        $user = Auth::user();
        
        return Inertia::render('Admin/CreateReceipt', [
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->user_role,
            ],
        ]);
    }

    public function destroy($id)
    {
        $receipt = Receipt::findOrFail($id);
        $receipt->delete();

        return redirect()->route('admin.receipts')->with('success', 'Receipt deleted successfully');
    }    public function printReceipt($id)
    {
        $receipt = Receipt::with('patient')->findOrFail($id);
        
        // Decode items and ensure numeric values
        $items = [];
        if ($receipt->items) {
            $decodedItems = json_decode($receipt->items, true);
            foreach ($decodedItems as $item) {
                $items[] = [
                    'description' => $item['description'] ?? '',
                    'quantity' => (int)($item['quantity'] ?? 0),
                    'unit_price' => (float)($item['unit_price'] ?? 0),
                    'amount' => (float)($item['amount'] ?? 0),
                ];
            }
        }
          $formattedReceipt = [
            'id' => $receipt->id,
            'receipt_number' => $receipt->receipt_number,
            'patient' => $receipt->patient ? [
                'id' => $receipt->patient->id,
                'name' => $receipt->patient->name,
                'reference' => $receipt->patient->reference_number,
            ] : null,
            'amount' => number_format($receipt->amount, 2),
            'payment_method' => $receipt->payment_method,
            'payment_date' => Carbon::parse($receipt->payment_date)->format('m/d/Y'),
            'items' => $items,
            'status' => $receipt->status ?? 'completed',
            'created_at' => Carbon::parse($receipt->created_at)->format('m/d/Y h:i A'),
        ];

        return Inertia::render('Admin/PrintReceipt', [
            'receipt' => $formattedReceipt,
        ]);
    }
}
