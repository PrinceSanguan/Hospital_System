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
            <h2 class="section-title">Medical Record Details</h2>
            <p class="reference">Record #: {{ $record['id'] }}</p>
            
            <div class="field">
                <span class="field-label">Status:</span>
                <span class="field-value status status-{{ strtolower($record['status']) }}">
                    {{ ucfirst($record['status']) }}
                </span>
            </div>
            
            <div class="field">
                <span class="field-label">Record Type:</span>
                <span class="field-value">{{ $record['record_type'] }}</span>
            </div>
            
            <div class="field">
                <span class="field-label">Date:</span>
                <span class="field-value">{{ $record['formatted_date'] }}</span>
            </div>
            
            <div class="field">
                <span class="field-label">Created On:</span>
                <span class="field-value">{{ $record['created_at'] }}</span>
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
                <span class="field-value">{{ $patient['birthdate'] }}</span>
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
        </div>
        @endif
        
        @if(isset($details['diagnosis']))
        <div class="section">
            <h2 class="section-title">Diagnosis</h2>
            <div style="white-space: pre-line;">{{ $details['diagnosis'] }}</div>
        </div>
        @endif
        
        @if(isset($details['notes']))
        <div class="section">
            <h2 class="section-title">Notes</h2>
            <div style="white-space: pre-line;">{{ $details['notes'] }}</div>
        </div>
        @endif
        
        @if(isset($details['medical_history']))
        <div class="section">
            <h2 class="section-title">Medical History</h2>
            <div style="white-space: pre-line;">{{ $details['medical_history'] }}</div>
        </div>
        @endif
        
        @if(isset($details['followup_date']))
        <div class="section">
            <h2 class="section-title">Follow-up Information</h2>
            <div class="field">
                <span class="field-label">Follow-up Date:</span>
                <span class="field-value">{{ date('F j, Y', strtotime($details['followup_date'])) }}</span>
            </div>
        </div>
        @endif
        
        @if(isset($details['prescriptions']) && is_array($details['prescriptions']) && count($details['prescriptions']) > 0)
        <div class="section">
            <h2 class="section-title">Prescriptions</h2>
            <table>
                <thead>
                    <tr>
                        <th>Medication</th>
                        <th>Dosage</th>
                        <th>Frequency</th>
                        <th>Duration</th>
                        <th>Instructions</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($details['prescriptions'] as $prescription)
                        <tr>
                            <td>
                                @if(is_array($prescription))
                                    {{ $prescription['medication'] ?? 'N/A' }}
                                @else
                                    {{ $prescription }}
                                @endif
                            </td>
                            <td>
                                @if(is_array($prescription))
                                    {{ $prescription['dosage'] ?? 'N/A' }}
                                @else
                                    N/A
                                @endif
                            </td>
                            <td>
                                @if(is_array($prescription))
                                    {{ $prescription['frequency'] ?? 'N/A' }}
                                @else
                                    N/A
                                @endif
                            </td>
                            <td>
                                @if(is_array($prescription))
                                    {{ $prescription['duration'] ?? 'N/A' }}
                                @else
                                    N/A
                                @endif
                            </td>
                            <td>
                                @if(is_array($prescription))
                                    {{ $prescription['instructions'] ?? 'N/A' }}
                                @else
                                    N/A
                                @endif
                            </td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>
        @endif
        
        <div class="footer">
            <p>This document was generated on {{ date('F j, Y') }} at {{ date('h:i A') }}</p>
            <p>{{ $hospital['name'] }} - Medical Record</p>
        </div>
    </div>
</body>
</html>
