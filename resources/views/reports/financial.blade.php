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
            min-width: 200px;
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
        .chart-placeholder {
            width: 100%;
            height: 250px;
            background-color: #f9f9f9;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px dashed #ccc;
            margin-bottom: 20px;
        }
        .footer {
            text-align: center;
            font-size: 12px;
            color: #666;
            margin-top: 50px;
            border-top: 1px solid #ddd;
            padding-top: 10px;
        }
        .currency {
            font-family: 'Courier New', monospace;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{ $title }}</h1>
        <div class="timestamp">Generated on: {{ $generated_at }}</div>
    </div>

    <div class="section">
        <h2 class="section-title">Financial Overview</h2>
        <div class="stats-container">
            <div class="stat-box">
                <div class="stat-value currency">${{ number_format($total_revenue_ytd, 2) }}</div>
                <div class="stat-label">Total Revenue (YTD)</div>
            </div>
            <div class="stat-box">
                <div class="stat-value currency">${{ number_format($average_monthly_revenue, 2) }}</div>
                <div class="stat-label">Average Monthly Revenue</div>
            </div>
        </div>
    </div>

    <div class="section">
        <h2 class="section-title">Monthly Revenue</h2>
        <table>
            <thead>
                <tr>
                    <th>Month</th>
                    <th>Revenue</th>
                </tr>
            </thead>
            <tbody>
                @foreach($monthly_revenue as $month)
                <tr>
                    <td>{{ $month['month'] }}</td>
                    <td class="currency">${{ number_format($month['revenue'], 2) }}</td>
                </tr>
                @endforeach
                <tr style="font-weight: bold; background-color: #f2f2f2;">
                    <td>Total</td>
                    <td class="currency">${{ number_format(array_sum(array_column($monthly_revenue, 'revenue')), 2) }}</td>
                </tr>
            </tbody>
        </table>

        <div class="chart-placeholder">
            [Bar chart would appear here in the actual PDF]
        </div>
    </div>

    <div class="section">
        <h2 class="section-title">Revenue by Service Type</h2>
        <table>
            <thead>
                <tr>
                    <th>Service</th>
                    <th>Revenue</th>
                    <th>Percentage</th>
                </tr>
            </thead>
            <tbody>
                @php
                    $totalServiceRevenue = array_sum(array_column($revenue_by_service, 'revenue'));
                @endphp

                @foreach($revenue_by_service as $service)
                <tr>
                    <td>{{ $service['service'] }}</td>
                    <td class="currency">${{ number_format($service['revenue'], 2) }}</td>
                    <td>{{ round(($service['revenue'] / $totalServiceRevenue) * 100, 1) }}%</td>
                </tr>
                @endforeach
                <tr style="font-weight: bold; background-color: #f2f2f2;">
                    <td>Total</td>
                    <td class="currency">${{ number_format($totalServiceRevenue, 2) }}</td>
                    <td>100%</td>
                </tr>
            </tbody>
        </table>

        <div class="chart-placeholder">
            [Pie chart would appear here in the actual PDF]
        </div>
    </div>

    <div class="section">
        <h2 class="section-title">Financial Notes</h2>
        <p>This financial report contains summary data for the clinic's revenue. For detailed financial statements including expenses, profits, and tax information, please refer to the complete accounting records.</p>
        <p>The data presented in this report is for informational purposes only and should be verified with official accounting records.</p>
    </div>

    <div class="footer">
        <p>© {{ date('Y') }} Choros Clinic Management System. All rights reserved.</p>
        <p>This report is confidential and intended for authorized personnel only.</p>
        <p><strong>CONFIDENTIAL FINANCIAL INFORMATION</strong></p>
    </div>
</body>
</html>
