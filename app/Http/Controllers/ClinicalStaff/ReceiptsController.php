<?php

namespace App\Http\Controllers\ClinicalStaff;

use App\Http\Controllers\Controller;
use App\Models\Receipt;
use App\Models\Appointment;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Response;

class ReceiptsController extends Controller
{
    public function index()
    {
        $receipts = Receipt::with(['patient', 'appointment'])
            ->latest()
            ->paginate(10);

        $user = Auth::user();

        return Inertia::render('ClinicalStaff/Receipts', [
            'receipts' => $receipts,
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->user_role,
            ]
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'patient_id' => 'required|exists:patients,id',
            'appointment_id' => 'nullable|exists:appointments,id',
            'amount' => 'required|numeric|min:0',
            'payment_method' => 'required|string',
            'payment_date' => 'required|date',
            'items' => 'required|json',
        ]);

        // Parse the items JSON
        $items = json_decode($validated['items'], true);

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

            // Recalculate amount to ensure it's correct
            $itemAmount = $item['quantity'] * $item['unit_price'];
            $calculatedTotal += $itemAmount;

            // Add to descriptions for summary
            $itemDescriptions[] = $item['description'];
        }

        // Check if calculated total matches the provided total (with a small tolerance for floating point errors)
        if (abs($calculatedTotal - (float)$validated['amount']) > 0.01) {
            return redirect()->back()->withErrors(['amount' => 'Total amount does not match item totals'])->withInput();
        }

        // Convert amount to a properly formatted decimal
        $amount = number_format((float)$validated['amount'], 2, '.', '');

        // Create a combined description from item descriptions
        $description = implode(', ', $itemDescriptions);

        // If no appointment_id is provided, just proceed without it
        if (empty($validated['appointment_id'])) {
            $receipt = Receipt::create([
                'receipt_number' => Receipt::generateReceiptNumber(),
                'patient_id' => $validated['patient_id'],
                'appointment_id' => null, // Explicitly set to null
                'amount' => $amount,
                'payment_method' => $validated['payment_method'],
                'payment_date' => $validated['payment_date'],
                'description' => $description,
                'created_by' => Auth::id(),
                'items' => $validated['items'], // Store the raw JSON
            ]);
        } else {
            // Handle with appointment
            $appointment = Appointment::with('patient')->findOrFail($validated['appointment_id']);

            $receipt = Receipt::create([
                'receipt_number' => Receipt::generateReceiptNumber(),
                'patient_id' => $appointment->patient_id,
                'appointment_id' => $appointment->id,
                'amount' => $amount,
                'payment_method' => $validated['payment_method'],
                'payment_date' => $validated['payment_date'],
                'description' => $description,
                'created_by' => Auth::id(),
                'items' => $validated['items'], // Store the raw JSON
            ]);
        }

        return redirect()->route('staff.receipts.index')->with('success', 'Receipt created successfully');
    }

    public function show(Receipt $receipt)
    {
        return Inertia::render('ClinicalStaff/ReceiptDetail', [
            'receipt' => $receipt->load(['patient', 'appointment', 'creator'])
        ]);
    }

    public function download(Receipt $receipt)
    {
        try {
            $receipt->load(['patient', 'appointment', 'creator']);

            // Ensure amount is properly formatted as a float
            $receipt->amount = (float)$receipt->amount;

            // Force numeric amount to ensure proper display
            if ($receipt->amount == 0 && !is_numeric($receipt->amount)) {
                $receipt->amount = 0.00;
            }

            $pdf = PDF::loadView('pdfs.receipt', [
                'receipt' => $receipt,
                'receipt_number' => sprintf('%04d', $receipt->id) // Ensure 4-digit format with leading zeros
            ]);

            $filename = 'receipt-' . $receipt->receipt_number . '.pdf';

            // Set paper to letter/A4 size (8.5 x 11 inches)
            $pdf->setPaper('letter');

            // Force the PDF to be downloaded as a file rather than displayed in browser
            return Response::make($pdf->output(), 200, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'attachment; filename="' . $filename . '"',
            ]);
        } catch (\Exception $e) {
            // Log the error for debugging
            Log::error('Error generating receipt PDF: ' . $e->getMessage(), [
                'receipt_id' => $receipt->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            // Return a response that indicates an error occurred
            return response()->json([
                'error' => 'An error occurred while generating the PDF.',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    public function destroy($id)
    {
        $receipt = Receipt::findOrFail($id);
        $receipt->delete();

        return redirect()->back()->with('success', 'Receipt deleted successfully');
    }
}
