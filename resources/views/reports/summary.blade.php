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
            <p>This report provides a comprehensive overview of the clinic's operational metrics, including user statistics, appointment data, and performance trends. It highlights key indicators for management review and strategic planning.</p>
        </div>

        <div class="section">
            <h2 class="section-title">User Statistics</h2>
            <div class="stats-container">
                <div class="stat-box primary">
                    <div class="stat-value">{{ $user_stats['total'] }}</div>
                    <div class="stat-label">Total Users</div>
                </div>
                <div class="stat-box success">
                    <div class="stat-value">{{ $user_stats['patients'] }}</div>
                    <div class="stat-label">Patients</div>
                </div>
                <div class="stat-box warning">
                    <div class="stat-value">{{ $user_stats['doctors'] }}</div>
                    <div class="stat-label">Doctors</div>
                </div>
                <div class="stat-box danger">
                    <div class="stat-value">{{ $user_stats['staff'] }}</div>
                    <div class="stat-label">Staff</div>
                </div>
            </div>

            <div class="chart-placeholder">
                [User Distribution Pie Chart]
            </div>
        </div>

        <div class="section">
            <h2 class="section-title">Appointment Statistics</h2>
            <div class="stats-container">
                <div class="stat-box primary">
                    <div class="stat-value">{{ $appointment_stats['total'] }}</div>
                    <div class="stat-label">Total Appointments</div>
                </div>
                <div class="stat-box warning">
                    <div class="stat-value">{{ $appointment_stats['pending'] }}</div>
                    <div class="stat-label">Pending</div>
                </div>
                <div class="stat-box success">
                    <div class="stat-value">{{ $appointment_stats['completed'] }}</div>
                    <div class="stat-label">Completed</div>
                </div>
                <div class="stat-box danger">
                    <div class="stat-value">{{ $appointment_stats['cancelled'] }}</div>
                    <div class="stat-label">Cancelled</div>
                </div>
            </div>

            <div class="chart-placeholder">
                [Appointment Status Pie Chart]
            </div>
        </div>

        <div class="section">
            <h2 class="section-title">Monthly Appointment Trends</h2>
            <div class="chart-placeholder">
                [Monthly Appointment Trends Line Chart]
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Month</th>
                        <th>Pending</th>
                        <th>Completed</th>
                        <th>Cancelled</th>
                        <th class="text-right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach($monthly_trends as $trend)
                    <tr>
                        <td>{{ $trend['name'] }}</td>
                        <td>{{ $trend['pending'] }}</td>
                        <td>{{ $trend['completed'] }}</td>
                        <td>{{ $trend['cancelled'] }}</td>
                        <td class="text-right text-bold">{{ $trend['pending'] + $trend['completed'] + $trend['cancelled'] }}</td>
                    </tr>
                    @endforeach
                    <tr class="text-bold">
                        <td>Total</td>
                        <td>{{ array_sum(array_column($monthly_trends, 'pending')) }}</td>
                        <td>{{ array_sum(array_column($monthly_trends, 'completed')) }}</td>
                        <td>{{ array_sum(array_column($monthly_trends, 'cancelled')) }}</td>
                        <td class="text-right">{{
                            array_sum(array_column($monthly_trends, 'pending')) +
                            array_sum(array_column($monthly_trends, 'completed')) +
                            array_sum(array_column($monthly_trends, 'cancelled'))
                        }}</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="section">
            <h2 class="section-title">Key Performance Insights</h2>
            <p>Based on the data collected, the following insights have been identified:</p>
            <ul>
                <li>The clinic has a <strong>{{ round(($appointment_stats['completed'] / $appointment_stats['total']) * 100, 1) }}%</strong> appointment completion rate.</li>
                <li>The average patient-to-doctor ratio is <strong>{{ round($user_stats['patients'] / max(1, $user_stats['doctors']), 1) }}</strong>.</li>
                <li>The cancellation rate for appointments is <strong>{{ round(($appointment_stats['cancelled'] / $appointment_stats['total']) * 100, 1) }}%</strong>.</li>
            </ul>
        </div>

        @include('reports.partials.footer')
    </div>
</body>
</html>
