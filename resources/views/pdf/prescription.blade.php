<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Medical Prescription</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            color: #333;
            font-size: 12px;
            line-height: 1.5;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            text-align: center;
            padding-bottom: 10px;
            border-bottom: 2px solid #4a90e2;
            margin-bottom: 20px;
        }
        .header h1 {
            color: #4a90e2;
            margin: 5px 0;
            font-size: 24px;
        }
        .header p {
            margin: 5px 0;
            color: #666;
        }
        .prescription-details {
            margin-bottom: 30px;
        }
        .prescription-details table {
            width: 100%;
            border-collapse: collapse;
        }
        .prescription-details table td {
            padding: 5px 10px;
        }
        .prescription-details .reference {
            float: right;
            color: #666;
            font-style: italic;
        }
        .patient-details {
            margin-bottom: 30px;
            padding: 10px;
            background-color: #f9f9f9;
            border-radius: 5px;
        }
        .medications {
            margin-bottom: 30px;
        }
        .medications table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        .medications table th {
            background-color: #4a90e2;
            color: white;
            padding: 10px;
            text-align: left;
        }
        .medications table td {
            padding: 8px 10px;
            border-bottom: 1px solid #ddd;
        }
        .footer {
            margin-top: 50px;
            border-top: 1px solid #ddd;
            padding-top: 20px;
            position: fixed;
            bottom: 0;
            width: 100%;
        }
        .signature-box {
            border-top: 1px solid #000;
            width: 200px;
            padding-top: 5px;
            text-align: center;
            margin-top: 60px;
            float: right;
        }
        .rx-symbol {
            font-size: 24px;
            font-weight: bold;
            margin-right: 5px;
        }
        .watermark {
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            opacity: 0.1;
            font-size: 100px;
            color: #4a90e2;
            z-index: -1;
        }
    </style>
</head>
<body>
    <div class="watermark">FAMCARE</div>
    <div class="container">
        <div class="header">
            <h1>{{ $clinic_name }}</h1>
            <p>{{ $clinic_address }}</p>
            <p>Phone: {{ $clinic_contact }}</p>
        </div>

        <div class="prescription-details">
            <div class="reference">Ref No: {{ $prescription->reference_number }}</div>
            <h2>Medical Prescription</h2>
            <table>
                <tr>
                    <td><strong>Date:</strong></td>
                    <td>{{ date('F d, Y', strtotime($prescription->prescription_date)) }}</td>
                </tr>
            </table>
        </div>

        <div class="patient-details">
            <h3>Patient Information</h3>
            <table>
                <tr>
                    <td width="150"><strong>Name:</strong></td>
                    <td>{{ $prescription->patient->name }}</td>
                </tr>
                <tr>
                    <td><strong>Email:</strong></td>
                    <td>{{ $prescription->patient->email }}</td>
                </tr>
                @if($prescription->record && isset(json_decode($prescription->record->details)->diagnosis))
                <tr>
                    <td><strong>Diagnosis:</strong></td>
                    <td>{{ json_decode($prescription->record->details)->diagnosis }}</td>
                </tr>
                @endif
            </table>
        </div>

        <div class="medications">
            <h3><span class="rx-symbol">Rx</span> Medication</h3>
            <table>
                <thead>
                    <tr>
                        <th width="30%">Medication</th>
                        <th width="20%">Dosage</th>
                        <th width="25%">Frequency</th>
                        <th width="25%">Duration</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>{{ $prescription->medication }}</td>
                        <td>{{ $prescription->dosage }}</td>
                        <td>{{ $prescription->frequency }}</td>
                        <td>{{ $prescription->duration }}</td>
                    </tr>
                </tbody>
            </table>

            @if($prescription->instructions)
            <div class="instructions">
                <h4>Instructions:</h4>
                <p>{{ $prescription->instructions }}</p>
            </div>
            @endif
        </div>

        <div class="footer">
            <div class="signature-box">
                Dr. {{ $prescription->doctor->name }}<br>
                Licensed Medical Professional
            </div>
            <p style="font-size: 10px; color: #666; clear: both; padding-top: 30px; text-align: center;">
                This prescription is valid for 30 days from the date of issue.<br>
                Keep all medications out of reach of children.
            </p>
        </div>
    </div>
</body>
</html>
