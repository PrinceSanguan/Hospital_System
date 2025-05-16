<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ $title }}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 30px;
            line-height: 1.6;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 1px solid #ddd;
            padding-bottom: 10px;
        }
        .logo {
            max-width: 150px;
            height: auto;
        }
        h1 {
            font-size: 24px;
            color: #333;
        }
        .timestamp {
            font-size: 12px;
            color: #666;
            margin-bottom: 20px;
        }
        .section {
            margin-bottom: 30px;
        }
        .section-title {
            font-size: 18px;
            color: #0066cc;
            margin-bottom: 15px;
            border-bottom: 1px solid #eee;
            padding-bottom: 5px;
        }
        .stats-container {
            display: flex;
            flex-wrap: wrap;
            gap: 15px;
        }
        .stat-box {
            border: 1px solid #ddd;
            border-radius: 5px;
            padding: 15px;
            min-width: 120px;
            margin-bottom: 10px;
        }
        .stat-value {
            font-size: 24px;
            font-weight: bold;
            color: #0066cc;
        }
        .stat-label {
            font-size: 14px;
            color: #666;
        }
        .badge {
            display: inline-block;
            padding: 3px 7px;
            font-size: 11px;
            font-weight: bold;
            border-radius: 10px;
            color: white;
        }
        .badge-pending {
            background-color: #f59e0b;
        }
        .badge-completed {
            background-color: #10b981;
        }
        .badge-cancelled {
            background-color: #ef4444;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        th {
            background-color: #f2f2f2;
        }
        tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        .footer {
            text-align: center;
            font-size: 12px;
            color: #666;
            margin-top: 50px;
            border-top: 1px solid #ddd;
            padding-top: 10px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{ $title }}</h1>
        <div class="timestamp">Generated on: {{ $generated_at }}</div>
    </div>

    <div class="section">
        <h2 class="section-title">Appointment Overview</h2>
        <div class="stats-container">
            <div class="stat-box">
                <div class="stat-value">{{ $appointment_count }}</div>
                <div class="stat-label">Total Appointments</div>
            </div>
            <div class="stat-box">
                <div class="stat-value">{{ $appointment_stats['pending'] }}</div>
                <div class="stat-label">Pending</div>
            </div>
            <div class="stat-box">
                <div class="stat-value">{{ $appointment_stats['completed'] }}</div>
                <div class="stat-label">Completed</div>
            </div>
            <div class="stat-box">
                <div class="stat-value">{{ $appointment_stats['cancelled'] }}</div>
                <div class="stat-label">Cancelled</div>
            </div>
        </div>
    </div>

    <div class="section">
        <h2 class="section-title">Monthly Appointment Trends</h2>
        <table>
            <thead>
                <tr>
                    <th>Month</th>
                    <th>Pending</th>
                    <th>Completed</th>
                    <th>Cancelled</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
                @foreach($appointment_trends as $trend)
                <tr>
                    <td>{{ $trend['name'] }}</td>
                    <td>{{ $trend['pending'] }}</td>
                    <td>{{ $trend['completed'] }}</td>
                    <td>{{ $trend['cancelled'] }}</td>
                    <td>{{ $trend['pending'] + $trend['completed'] + $trend['cancelled'] }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>

    <div class="section">
        <h2 class="section-title">Appointment Types</h2>
        <table>
            <thead>
                <tr>
                    <th>Type</th>
                    <th>Count</th>
                    <th>Percentage</th>
                </tr>
            </thead>
            <tbody>
                @php
                    $totalAppointments = array_sum(array_column($appointment_types->toArray(), 'value'));
                @endphp

                @foreach($appointment_types as $type)
                <tr>
                    <td>{{ $type['name'] }}</td>
                    <td>{{ $type['value'] }}</td>
                    <td>{{ round(($type['value'] / $totalAppointments) * 100, 1) }}%</td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>

    <div class="section">
        <h2 class="section-title">Upcoming Appointments</h2>
        <table>
            <thead>
                <tr>
                    <th>Patient</th>
                    <th>Doctor</th>
                    <th>Date & Time</th>
                    <th>Type</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                @if(count($upcoming_appointments) > 0)
                    @foreach($upcoming_appointments as $appointment)
                    <tr>
                        <td>{{ $appointment->patient->name }}</td>
                        <td>{{ $appointment->assignedDoctor ? $appointment->assignedDoctor->name : 'Not assigned' }}</td>
                        <td>{{ \Carbon\Carbon::parse($appointment->appointment_date)->format('M d, Y g:i A') }}</td>
                        <td>{{ ucfirst(str_replace('_', ' ', $appointment->record_type)) }}</td>
                        <td>
                            <span class="badge badge-{{ $appointment->status }}">
                                {{ ucfirst($appointment->status) }}
                            </span>
                        </td>
                    </tr>
                    @endforeach
                @else
                    <tr>
                        <td colspan="5" style="text-align: center;">No upcoming appointments found</td>
                    </tr>
                @endif
            </tbody>
        </table>
    </div>

    <div class="footer">
        <p>© {{ date('Y') }} Choros Clinic Management System. All rights reserved.</p>
        <p>This report is confidential and intended for authorized personnel only.</p>
    </div>
</body>
</html>
