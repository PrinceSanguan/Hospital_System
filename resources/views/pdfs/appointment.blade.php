<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Appointment Details</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            font-size: 14px;
            line-height: 1.5;
        }
        .container {
            width: 100%;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #444;
            padding-bottom: 10px;
        }
        .title {
            font-size: 24px;
            font-weight: bold;
            margin: 0;
            padding: 0;
        }
        .subtitle {
            font-size: 16px;
            color: #555;
            margin: 5px 0;
        }
        .reference {
            font-size: 14px;
            color: #777;
            margin-top: 5px;
        }
        .section {
            margin-bottom: 20px;
        }
        .section-title {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 10px;
            border-bottom: 1px solid #ddd;
            padding-bottom: 5px;
        }
        .field {
            margin-bottom: 10px;
        }
        .field-label {
            font-weight: bold;
            display: inline-block;
            min-width: 150px;
        }
        .field-value {
            display: inline-block;
        }
        .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 12px;
            color: #777;
            border-top: 1px solid #ddd;
            padding-top: 10px;
        }
        .status {
            display: inline-block;
            padding: 5px 10px;
            font-weight: bold;
            border-radius: 4px;
            font-size: 12px;
        }
        .status-confirmed {
            background: #e3f2fd;
            color: #0d47a1;
        }
        .status-pending {
            background: #fff8e1;
            color: #ff8f00;
        }
        .status-cancelled {
            background: #ffebee;
            color: #c62828;
        }
        .status-completed {
            background: #e8f5e9;
            color: #2e7d32;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 8px 12px;
            text-align: left;
        }
        th {
            background-color: #f8f9fa;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="title">{{ $hospital['name'] }}</h1>
            <p class="subtitle">{{ $hospital['address'] }}</p>
            <p class="subtitle">Tel: {{ $hospital['phone'] }} | Email: {{ $hospital['email'] }}</p>
        </div>
        
        <div class="section">
            <h2 class="section-title">Appointment Details</h2>
            <p class="reference">Reference #: {{ $appointment['reference_number'] }}</p>
            
            <div class="field">
                <span class="field-label">Status:</span>
                <span class="field-value status status-{{ strtolower($appointment['status']) }}">
                    {{ ucfirst($appointment['status']) }}
                </span>
            </div>
            
            <div class="field">
                <span class="field-label">Date:</span>
                <span class="field-value">{{ $appointment['formatted_date'] }}</span>
            </div>
            
            <div class="field">
                <span class="field-label">Time:</span>
                <span class="field-value">{{ $appointment['time'] ?: 'Not specified' }}</span>
            </div>
            
            <div class="field">
                <span class="field-label">Reason for Visit:</span>
                <span class="field-value">{{ $appointment['reason'] }}</span>
            </div>
        </div>
        
        <div class="section">
            <h2 class="section-title">Patient Information</h2>
            
            <div class="field">
                <span class="field-label">Name:</span>
                <span class="field-value">{{ $patient['name'] }}</span>
            </div>
            
            @if(isset($patient['email']))
            <div class="field">
                <span class="field-label">Email:</span>
                <span class="field-value">{{ $patient['email'] }}</span>
            </div>
            @endif
            
            @if(isset($patient['phone']))
            <div class="field">
                <span class="field-label">Phone:</span>
                <span class="field-value">{{ $patient['phone'] }}</span>
            </div>
            @endif
            
            @if(isset($patient['birthdate']))
            <div class="field">
                <span class="field-label">Date of Birth:</span>
                <span class="field-value">{{ date('F j, Y', strtotime($patient['birthdate'])) }}</span>
            </div>
            @endif
            
            @if(isset($patient['gender']))
            <div class="field">
                <span class="field-label">Gender:</span>
                <span class="field-value">{{ ucfirst($patient['gender']) }}</span>
            </div>
            @endif
        </div>
        
        @if($doctor)
        <div class="section">
            <h2 class="section-title">Doctor Information</h2>
            
            <div class="field">
                <span class="field-label">Name:</span>
                <span class="field-value">Dr. {{ $doctor['name'] }}</span>
            </div>
            
            @if(isset($doctor['email']))
            <div class="field">
                <span class="field-label">Email:</span>
                <span class="field-value">{{ $doctor['email'] }}</span>
            </div>
            @endif
        </div>
        @endif
        
        @if(isset($details['vital_signs']))
        <div class="section">
            <h2 class="section-title">Vital Signs</h2>
            
            <table>
                <tr>
                    @if(isset($details['vital_signs']['temperature']))
                    <th>Temperature</th>
                    @endif
                    @if(isset($details['vital_signs']['pulse_rate']))
                    <th>Pulse Rate</th>
                    @endif
                    @if(isset($details['vital_signs']['respiratory_rate']))
                    <th>Respiratory Rate</th>
                    @endif
                    @if(isset($details['vital_signs']['blood_pressure']))
                    <th>Blood Pressure</th>
                    @endif
                    @if(isset($details['vital_signs']['oxygen_saturation']))
                    <th>Oxygen Saturation</th>
                    @endif
                </tr>
                <tr>
                    @if(isset($details['vital_signs']['temperature']))
                    <td>{{ $details['vital_signs']['temperature'] }} °C</td>
                    @endif
                    @if(isset($details['vital_signs']['pulse_rate']))
                    <td>{{ $details['vital_signs']['pulse_rate'] }} bpm</td>
                    @endif
                    @if(isset($details['vital_signs']['respiratory_rate']))
                    <td>{{ $details['vital_signs']['respiratory_rate'] }} breaths/min</td>
                    @endif
                    @if(isset($details['vital_signs']['blood_pressure']))
                    <td>{{ $details['vital_signs']['blood_pressure'] }}</td>
                    @endif
                    @if(isset($details['vital_signs']['oxygen_saturation']))
                    <td>{{ $details['vital_signs']['oxygen_saturation'] }}%</td>
                    @endif
                </tr>
            </table>
            
            @if(isset($details['vital_signs']['recorded_at']))
            <div class="field">
                <span class="field-label">Recorded At:</span>
                <span class="field-value">{{ $details['vital_signs']['recorded_at'] }}</span>
            </div>
            @endif
        </div>
        @endif
        
        @if(isset($details['notes']))
        <div class="section">
            <h2 class="section-title">Notes</h2>
            <p>{{ $details['notes'] }}</p>
        </div>
        @endif
        
        @if(isset($details['medical_records']))
        <div class="section">
            <h2 class="section-title">Medical Records</h2>
            
            @if(isset($details['medical_records']['diagnosis']))
            <div class="field">
                <span class="field-label">Diagnosis:</span>
                <span class="field-value">{{ $details['medical_records']['diagnosis'] }}</span>
            </div>
            @endif
            
            @if(isset($details['medical_records']['treatment']))
            <div class="field">
                <span class="field-label">Treatment:</span>
                <span class="field-value">{{ $details['medical_records']['treatment'] }}</span>
            </div>
            @endif
            
            @if(isset($details['medical_records']['prescription']))
            <div class="field">
                <span class="field-label">Prescription:</span>
                <div class="field-value" style="white-space: pre-line;">{{ $details['medical_records']['prescription'] }}</div>
            </div>
            @endif
            
            @if(isset($details['medical_records']['notes']))
            <div class="field">
                <span class="field-label">Medical Notes:</span>
                <div class="field-value" style="white-space: pre-line;">{{ $details['medical_records']['notes'] }}</div>
            </div>
            @endif
            
            @if(isset($details['medical_records']['follow_up']))
            <div class="field">
                <span class="field-label">Follow Up:</span>
                <span class="field-value">{{ $details['medical_records']['follow_up'] }}</span>
            </div>
            @endif
            
            @if(isset($details['medical_records']['history']))
            <div class="field">
                <span class="field-label">Medical History:</span>
                <div class="field-value" style="white-space: pre-line;">{{ $details['medical_records']['history'] }}</div>
            </div>
            @endif
            
            @if(isset($details['medical_records']['lab_results']) && count($details['medical_records']['lab_results']) > 0)
            <div style="margin-top: 15px;">
                <h3 style="font-size: 16px; margin-bottom: 10px;">Lab Results</h3>
                <table>
                    <tr>
                        <th>Test Name</th>
                        <th>Result</th>
                        <th>Normal Range</th>
                        <th>Notes</th>
                    </tr>
                    @foreach($details['medical_records']['lab_results'] as $result)
                    <tr style="background-color: {{ isset($result['is_abnormal']) && $result['is_abnormal'] ? '#ffeeee' : '#f5fff5' }}">
                        <td>{{ $result['test_name'] ?? 'N/A' }}</td>
                        <td style="font-weight: {{ isset($result['is_abnormal']) && $result['is_abnormal'] ? 'bold' : 'normal' }}">
                            {{ $result['result'] ?? 'N/A' }} {{ $result['unit'] ?? '' }}
                        </td>
                        <td>{{ $result['normal_range'] ?? 'N/A' }}</td>
                        <td>{{ $result['notes'] ?? '' }}</td>
                    </tr>
                    @endforeach
                </table>
            </div>
            @endif
        </div>
        @endif
        
        @if(isset($details['uploaded_files']) && count($details['uploaded_files']) > 0)
        <div class="section">
            <h2 class="section-title">Attachments</h2>
            <ul>
                @foreach($details['uploaded_files'] as $file)
                <li>{{ $file['name'] }}</li>
                @endforeach
            </ul>
            <p style="font-style: italic; font-size: 12px;">Note: Attachments are not included in this PDF. Please access them through the system.</p>
        </div>
        @endif
        
        <div class="footer">
            <p>This document was generated on {{ date('F j, Y') }} at {{ date('h:i A') }}</p>
            <p>General Hospital - Appointment Details</p>
        </div>
    </div>
</body>
</html>
