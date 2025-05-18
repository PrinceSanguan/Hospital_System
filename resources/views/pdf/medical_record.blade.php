<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Medical Record</title>
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
        .record-details {
            margin-bottom: 30px;
        }
        .record-details table {
            width: 100%;
            border-collapse: collapse;
        }
        .record-details table td {
            padding: 5px 10px;
        }
        .patient-details {
            margin-bottom: 30px;
            padding: 10px;
            background-color: #f9f9f9;
            border-radius: 5px;
        }
        .patient-details table {
            width: 100%;
            border-collapse: collapse;
        }
        .patient-details table th {
            text-align: left;
            width: 150px;
            padding: 5px;
        }
        .patient-details table td {
            padding: 5px;
        }
        .section {
            margin-bottom: 20px;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 5px;
        }
        .section h3 {
            margin-top: 0;
            color: #4a90e2;
            border-bottom: 1px solid #eee;
            padding-bottom: 5px;
        }
        .vital-signs {
            margin-bottom: 20px;
        }
        .vital-signs table {
            width: 100%;
            border-collapse: collapse;
        }
        .vital-signs table th {
            background-color: #f1f1f1;
            padding: 8px;
            text-align: left;
            border: 1px solid #ddd;
        }
        .vital-signs table td {
            padding: 8px;
            border: 1px solid #ddd;
        }
        .prescriptions table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        .prescriptions table th {
            background-color: #4a90e2;
            color: white;
            padding: 10px;
            text-align: left;
            border: 1px solid #4a90e2;
        }
        .prescriptions table td {
            padding: 8px 10px;
            border: 1px solid #ddd;
        }
        .footer {
            margin-top: 50px;
            border-top: 1px solid #ddd;
            padding-top: 20px;
            text-align: center;
            font-size: 10px;
            color: #666;
        }
        .signature-box {
            border-top: 1px solid #000;
            width: 200px;
            padding-top: 5px;
            text-align: center;
            margin-top: 60px;
            float: right;
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
        .main-title {
            text-align: center;
            margin-bottom: 5px;
        }
        .main-title h1 {
            font-size: 18px;
            margin-bottom: 5px;
        }
        .main-title p {
            margin: 5px 0;
            font-size: 13px;
        }
        .info-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        .info-table th {
            background-color: #f8f8f8;
            text-align: left;
            padding: 6px 10px;
            border: 1px solid #ddd;
            width: 30%;
            font-size: 12px;
        }
        .info-table td {
            padding: 6px 10px;
            border: 1px solid #ddd;
            font-size: 12px;
        }
        .section-title {
            font-size: 14px;
            font-weight: bold;
            margin-top: 20px;
            margin-bottom: 10px;
        }
        .section-content {
            padding: 10px;
            border: 1px solid #ddd;
            background-color: #f9f9f9;
            margin-bottom: 15px;
        }
    </style>
</head>
<body>
    <div class="watermark">FAMCARE</div>
    <div class="container">
        <div class="main-title">
            <h1>Medical Record</h1>
            <p>Physician: Dr. {{ $doctor_name }}</p>
            <p>Viewing medical record from {{ date('F d, Y', strtotime($record->appointment_date)) }}</p>
        </div>

        <p>The following information is a comprehensive medical record of the patient, intended for professional use only. This document ensures a detailed overview of the patient's medical history and current health status.</p>

        <div class="section-title">Patient Information</div>
        <table class="info-table">
            <tr>
                <th>Patient Information</th>
                <th>Details</th>
            </tr>
            <tr>
                <td>Name:</td>
                <td>{{ $record->patient->name }}</td>
            </tr>
            <tr>
                <td>Date of Birth:</td>
                <td>{{ $details['patient_info']['birthdate'] ?? $record->patient->date_of_birth ?? 'N/A' }}</td>
            </tr>
            <tr>
                <td>Email:</td>
                <td>{{ $record->patient->email ?? $details['patient_info']['email'] ?? 'N/A' }}</td>
            </tr>
            <tr>
                <td>Address:</td>
                <td>{{ $record->patient->address ?? $details['patient_info']['address'] ?? $details['address'] ?? 'N/A' }}</td>
            </tr>
            <tr>
                <td>Doctor:</td>
                <td>Dr. {{ $doctor_name }}@if($doctor_specialization), {{ $doctor_specialization }}@endif</td>
            </tr>
            <tr>
                <td>Record Type:</td>
                <td>{{ ucfirst(str_replace('_', ' ', $record->record_type)) }}</td>
            </tr>
            <tr>
                <td>Status:</td>
                <td>{{ ucfirst($record->status) }}</td>
            </tr>
            <tr>
                <td>Appointment Date:</td>
                <td>{{ date('F d, Y', strtotime($record->appointment_date)) }}</td>
            </tr>
            <tr>
                <td>Appointment Time:</td>
                <td>{{ $details['appointment_time'] ?? '14:00:00' }}</td>
            </tr>
            <tr>
                <td>Created Date:</td>
                <td>{{ date('F d, Y', strtotime($record->created_at)) }}</td>
            </tr>
            <tr>
                <td>Follow-up Date:</td>
                <td>{{ isset($details['followup_date']) ? date('F d, Y', strtotime($details['followup_date'])) : 'N/A' }}</td>
            </tr>
        </table>

        @if(isset($details['diagnosis']))
        <div class="section-title">Diagnosis</div>
        <div class="section-content">
            {{ $details['diagnosis'] }}
        </div>
        @endif

        @if(isset($details['prescriptions']) && !empty($details['prescriptions']))
        <div class="section-title">Prescriptions</div>
        <table class="info-table">
            <tr>
                <th>Medication</th>
                <th>Dosage</th>
                <th>Frequency</th>
                <th>Duration</th>
                <th>Instructions</th>
            </tr>
            @foreach($details['prescriptions'] as $prescription)
            @php
                $prescription = is_string($prescription) ? json_decode($prescription, true) : $prescription;
            @endphp
            <tr>
                <td>{{ $prescription['medication'] ?? '-' }}</td>
                <td>{{ $prescription['dosage'] ?? '-' }}</td>
                <td>{{ $prescription['frequency'] ?? '-' }}</td>
                <td>{{ $prescription['duration'] ?? '-' }}</td>
                <td>{{ $prescription['instructions'] ?? '-' }}</td>
            </tr>
            @endforeach
        </table>
        @endif

        @if(isset($details['notes']))
        <div class="section-title">Notes</div>
        <div class="section-content">
            {{ $details['notes'] }}
        </div>
        @endif

        <div class="footer">
            <div class="signature-box">
                Dr. {{ $doctor_name }}<br>
                @if($doctor_specialization){{ $doctor_specialization }}<br>@endif
                Licensed Medical Professional
            </div>
            <p style="clear: both; padding-top: 30px; text-align: center;">
                This is an official medical record from {{ $clinic_name }}.<br>
                Generated on {{ $date }}
            </p>
        </div>
    </div>
</body>
</html>
