<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>{{ $title }}</title>
    @include('reports.partials.styles')
    <style>
        @page { margin: 0cm 0cm; }
        body { margin: 2.5cm 1cm; }
    </style>
</head>
<body>
    <div class="watermark">CHOROS</div>
    <div class="report-container">
        @include('reports.partials.header')

        <div class="report-title">
            <h1>{{ $title }}</h1>
            <div class="timestamp">Generated on: {{ $generated_at }}</div>
        </div>

        <div class="section">
            <h2 class="section-title">Executive Summary</h2>
            <p>This report presents comprehensive patient statistics and demographics, offering insights into patient growth, registration patterns, and overall patient metrics. The data provides a foundation for service planning and patient care strategy development.</p>
        </div>

        <div class="section">
            <h2 class="section-title">Patient Overview</h2>
            <div class="stats-container">
                <div class="stat-box primary">
                    <div class="stat-value">{{ $patient_count }}</div>
                    <div class="stat-label">Total Patients</div>
                </div>
                <div class="stat-box success">
                    <div class="stat-value">{{ $new_patients_this_month }}</div>
                    <div class="stat-label">New Patients This Month</div>
                </div>
                <div class="stat-box warning">
                    <div class="stat-value">{{ round(($new_patients_this_month / max(1, $patient_count)) * 100, 1) }}%</div>
                    <div class="stat-label">Monthly Growth Rate</div>
                </div>
            </div>

            <div class="chart-placeholder">
                [Patient Demographics Pie Chart]
            </div>
        </div>

        <div class="section">
            <h2 class="section-title">Patient Growth by Month</h2>
            <div class="chart-placeholder">
                [Monthly Patient Growth Bar Chart]
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Month</th>
                        <th>New Patients</th>
                        <th class="text-right">Running Total</th>
                    </tr>
                </thead>
                <tbody>
                    @php
                        $runningTotal = 0;
                        $totalNewPatients = 0;
                    @endphp

                    @foreach($patients_by_month as $month)
                    @php
                        $runningTotal += $month['new_patients'];
                        $totalNewPatients += $month['new_patients'];
                    @endphp
                    <tr>
                        <td>{{ $month['name'] }}</td>
                        <td>{{ $month['new_patients'] }}</td>
                        <td class="text-right">{{ $runningTotal }}</td>
                    </tr>
                    @endforeach
                    <tr class="text-bold">
                        <td>Total</td>
                        <td>{{ $totalNewPatients }}</td>
                        <td class="text-right">-</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="section">
            <h2 class="section-title">Recently Registered Patients</h2>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th class="text-right">Registration Date</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($recent_patients as $patient)
                    <tr>
                        <td>{{ $patient->id }}</td>
                        <td>{{ $patient->name }}</td>
                        <td>{{ $patient->email }}</td>
                        <td class="text-right">{{ \Carbon\Carbon::parse($patient->created_at)->format('M d, Y') }}</td>
                    </tr>
                    @endforeach
                </tbody>
            </table>
        </div>

        <div class="section">
            <h2 class="section-title">Key Insights</h2>
            <p>Based on the patient data collected, the following insights have been identified:</p>
            <ul>
                <li>The average monthly patient growth is <strong>{{ round($totalNewPatients / max(1, count($patients_by_month)), 1) }}</strong> patients.</li>
                <li>The clinic has seen <strong>{{ $new_patients_this_month }}</strong> new patient registrations in the current month.</li>
                <li>Over the past 6 months, the clinic has added <strong>{{ $totalNewPatients }}</strong> new patients to its registry.</li>
            </ul>
        </div>

        @include('reports.partials.footer')
    </div>
</body>
</html>
