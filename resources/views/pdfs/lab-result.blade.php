<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Lab Result - {{ $labResult->test_type }}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            max-width: 200px;
            margin-bottom: 10px;
        }
        .title {
            font-size: 24px;
            color: #333;
            margin-bottom: 5px;
        }
        .info-section {
            margin-bottom: 20px;
        }
        .info-title {
            font-weight: bold;
            margin-bottom: 5px;
        }
        .info-content {
            margin-left: 20px;
        }
        .result-image {
            max-width: 100%;
            margin: 20px 0;
        }
        .footer {
            margin-top: 50px;
            text-align: center;
            color: #666;
            font-size: 12px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        th, td {
            padding: 10px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        th {
            background-color: #f5f5f5;
            width: 30%;
        }
    </style>
</head>
<body>
    <div class="header">
        <img src="{{ public_path('images/logo.png') }}" alt="Logo" class="logo">
        <h1 class="title">Laboratory Result</h1>
    </div>

    <div class="info-section">
        <table>
            <tr>
                <th>Patient Name</th>
                <td>{{ $labResult->patient->name }}</td>
            </tr>
            <tr>
                <th>Patient ID</th>
                <td>{{ $labResult->patient->id }}</td>
            </tr>
            <tr>
                <th>Test Type</th>
                <td>{{ $labResult->test_type }}</td>
            </tr>
            <tr>
                <th>Test Date</th>
                <td>{{ $labResult->test_date->format('F j, Y g:i A') }}</td>
            </tr>
            <tr>
                <th>Doctor</th>
                <td>{{ $labResult->doctor->name }}</td>
            </tr>
            @if($labResult->notes)
            <tr>
                <th>Notes</th>
                <td>{{ $labResult->notes }}</td>
            </tr>
            @endif
        </table>
    </div>

    @if(isset($imageUrl))
    <div class="result-image">
        <img src="{{ $imageUrl }}" alt="Lab Result" style="max-width: 100%;">
    </div>
    @endif

    <div class="footer">
        <p>This document is electronically generated.</p>
        <p>Generated on {{ now()->format('F j, Y g:i A') }}</p>
    </div>
</body>
</html>
