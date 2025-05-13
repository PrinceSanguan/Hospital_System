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

        return Inertia::render('ClinicalStaff/Receipts', [
            'receipts' => $receipts,
            'auth' => [
                'user' => Auth::user()
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
            'description' => 'required|string',
        ]);

        // Convert amount to a properly formatted decimal
        $amount = number_format((float)$validated['amount'], 2, '.', '');

        // If no appointment_id is provided, just proceed without it
        if (empty($validated['appointment_id'])) {
            $receipt = Receipt::create([
                'receipt_number' => Receipt::generateReceiptNumber(),
                'patient_id' => $validated['patient_id'],
                'appointment_id' => null, // Explicitly set to null
                'amount' => $amount,
                'payment_method' => $validated['payment_method'],
                'payment_date' => $validated['payment_date'],
                'description' => $validated['description'],
                'created_by' => Auth::id(),
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
                'description' => $validated['description'],
                'created_by' => Auth::id(),
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
