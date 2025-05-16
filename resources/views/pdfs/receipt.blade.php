<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Receipt #{{ $receipt->receipt_number }}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            color: #000;
            line-height: 1.3;
            max-width: 8.5in;
            margin: 0.5in auto;
            padding: 0.5in;
            box-sizing: border-box;
        }
        .receipt-header {
            text-align: center;
            border-bottom: 1px solid #000;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        .receipt-title {
            font-size: 18px;
            font-weight: bold;
            text-transform: uppercase;
            margin: 0;
        }
        .receipt-subtitle {
            font-size: 12px;
            margin: 5px 0;
        }
        .receipt-number {
            font-size: 16px;
            font-weight: bold;
            text-align: right;
            color: #C00;
            margin-bottom: 10px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
        }
        table, th, td {
            border: 1px solid #000;
        }
        th, td {
            padding: 8px;
            text-align: left;
            font-size: 12px;
        }
        th {
            background-color: #f2f2f2;
            font-weight: bold;
        }
        .amount-section {
            margin-top: 20px;
            text-align: right;
        }
        .signature-line {
            margin-top: 40px;
            border-top: 1px solid #000;
            width: 200px;
            display: inline-block;
        }
        .footer {
            margin-top: 40px;
            font-size: 11px;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="receipt-header">
        <div class="receipt-number">No. {{ $receipt_number ?? sprintf('%04d', $receipt->id) }}</div>
        <div class="receipt-title">FAMCARE MEDICAL CLINIC AND LABORATORY</div>
        <div class="receipt-subtitle">
            Citi Beam Mega Market Poblacion II<br>
            8201 Digos City, Davao Del Sur, Oriental Philippines<br>
            Dr. BJ TUBOG - Prop<br>
            MON-SAT: 9AM-6PM | TIN #: 940-427-509-0001
        </div>
    </div>

    <div style="margin-bottom: 15px">
        <table style="border: none;">
            <tr style="border: none;">
                <td style="border: none; width: 120px;">PATIENT NAME:</td>
                <td style="border: none; border-bottom: 1px solid #000; font-weight: bold;">
                    {{ $receipt->patient->name ?? 'Unknown Patient' }}
                </td>
                <td style="border: none; width: 60px;">DATE:</td>
                <td style="border: none; border-bottom: 1px solid #000;">
                    {{ $receipt->payment_date ? date('m/d/Y', strtotime($receipt->payment_date)) : now()->format('m/d/Y') }}
                </td>
            </tr>
        </table>
    </div>

    <table>
        <thead>
            <tr>
                <th>ITEM</th>
                <th>QTY</th>
                <th>UNIT PRICE</th>
                <th>AMOUNT</th>
            </tr>
        </thead>
        <tbody>
            @php
                $hasItems = false;
                $items = [];
                if (isset($receipt->items) && !empty($receipt->items)) {
                    try {
                        $items = json_decode($receipt->items, true);
                        $hasItems = is_array($items) && count($items) > 0;
                    } catch (\Exception $e) {
                        // Fall back to description if JSON parse fails
                        $hasItems = false;
                    }
                }
            @endphp

            @if($hasItems)
                @foreach($items as $item)
                <tr>
                    <td>{{ $item['description'] }}</td>
                    <td>{{ $item['quantity'] }}</td>
                    <td>PHP {{ number_format((float)$item['unit_price'], 2) }}</td>
                    <td>PHP {{ number_format((float)$item['amount'], 2) }}</td>
                </tr>
                @endforeach
            @else
                <tr>
                    <td>{{ $receipt->description ?: 'Medical Services' }}</td>
                    <td>1</td>
                    <td>PHP {{ number_format((float)$receipt->amount, 2) }}</td>
                    <td>PHP {{ number_format((float)$receipt->amount, 2) }}</td>
                </tr>
            @endif

            @if($receipt->appointment_id && isset($receipt->appointment) && $receipt->appointment)
            <tr>
                <td colspan="3">Appointment: {{ date('m/d/Y', strtotime($receipt->appointment->appointment_date ?? now())) }}</td>
                <td></td>
            </tr>
            @endif
            <tr>
                <td colspan="3" style="text-align: right; font-weight: bold;">TOTAL</td>
                <td>PHP {{ number_format((float)$receipt->amount, 2) }}</td>
            </tr>
        </tbody>
    </table>

    <div class="amount-section">
        <p>
            <strong>Payment Method:</strong> {{ $receipt->payment_method }}<br>
            <strong>Payment Date:</strong> {{ date('m/d/Y', strtotime($receipt->payment_date)) }}<br>
            <strong>Total Amount:</strong> PHP {{ number_format((float)$receipt->amount, 2) }}
        </p>
    </div>

    <div style="margin-top: 60px; display: flex; justify-content: space-between;">
        <div>
            <div class="signature-line"></div>
            <div style="text-align: center;">Patient's Signature</div>
        </div>
        <div>
            <div class="signature-line"></div>
            <div style="text-align: center;">Cashier/Authorized Person</div>
        </div>
    </div>

    <div class="footer">
        Thank you for your payment!<br>
        This is an official receipt from FAMCARE MEDICAL CLINIC AND LABORATORY.
    </div>
</body>
</html>
