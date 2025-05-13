<style>
    body {
        font-family: 'Helvetica Neue', Arial, sans-serif;
        margin: 0;
        padding: 0;
        line-height: 1.6;
        color: #333;
        background-color: #fff;
    }
    .report-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
    }
    .header {
        padding: 20px 0;
        border-bottom: 2px solid #3b82f6;
        margin-bottom: 30px;
        position: relative;
    }
    .header-content {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    .logo-container {
        display: flex;
        align-items: center;
    }
    .logo {
        max-width: 150px;
        height: auto;
    }
    .company-name {
        margin-left: 15px;
        font-size: 20px;
        font-weight: 600;
        color: #333;
    }
    .report-title {
        text-align: center;
        margin: 25px 0;
    }
    .report-title h1 {
        font-size: 24px;
        color: #1f2937;
        margin: 0;
        font-weight: 600;
    }
    .timestamp {
        font-size: 12px;
        color: #6b7280;
        text-align: center;
        margin-bottom: 30px;
    }
    .section {
        margin-bottom: 40px;
        background-color: #fff;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        padding: 20px 25px;
        border: 1px solid #e5e7eb;
    }
    .section-title {
        font-size: 18px;
        color: #1f2937;
        margin-bottom: 20px;
        border-bottom: 1px solid #e5e7eb;
        padding-bottom: 10px;
        font-weight: 600;
    }
    .stats-container {
        display: flex;
        flex-wrap: wrap;
        gap: 20px;
        justify-content: space-between;
    }
    .stat-box {
        flex: 1;
        min-width: 180px;
        background-color: #f9fafb;
        border-radius: 8px;
        padding: 20px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        border-left: 4px solid #3b82f6;
        position: relative;
        transition: transform 0.2s;
    }
    .stat-box:hover {
        transform: translateY(-3px);
    }
    .stat-value {
        font-size: 28px;
        font-weight: 700;
        color: #3b82f6;
        margin-bottom: 8px;
    }
    .stat-label {
        font-size: 14px;
        color: #6b7280;
        font-weight: 500;
    }
    .stat-box.primary { border-left-color: #3b82f6; }
    .stat-box.primary .stat-value { color: #3b82f6; }

    .stat-box.success { border-left-color: #10b981; }
    .stat-box.success .stat-value { color: #10b981; }

    .stat-box.warning { border-left-color: #f59e0b; }
    .stat-box.warning .stat-value { color: #f59e0b; }

    .stat-box.danger { border-left-color: #ef4444; }
    .stat-box.danger .stat-value { color: #ef4444; }

    table {
        width: 100%;
        border-collapse: separate;
        border-spacing: 0;
        margin-bottom: 25px;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }
    thead {
        background-color: #f3f4f6;
    }
    th {
        background-color: #f3f4f6;
        font-weight: 600;
        text-align: left;
        padding: 12px 15px;
        font-size: 14px;
        color: #4b5563;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        border-bottom: 1px solid #e5e7eb;
    }
    td {
        padding: 12px 15px;
        border-bottom: 1px solid #e5e7eb;
        font-size: 14px;
    }
    tr:last-child td {
        border-bottom: none;
    }
    tr:nth-child(even) {
        background-color: #f9fafb;
    }
    tr:hover {
        background-color: #f3f4f6;
    }

    .badge {
        display: inline-block;
        padding: 4px 8px;
        font-size: 12px;
        font-weight: 600;
        border-radius: 4px;
        text-transform: capitalize;
    }
    .badge-pending {
        background-color: #fef3c7;
        color: #d97706;
    }
    .badge-completed {
        background-color: #d1fae5;
        color: #059669;
    }
    .badge-cancelled {
        background-color: #fee2e2;
        color: #dc2626;
    }

    .chart-placeholder {
        width: 100%;
        height: 300px;
        background-color: #f9fafb;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px dashed #d1d5db;
        border-radius: 8px;
        margin: 20px 0;
        color: #6b7280;
        font-style: italic;
    }

    .footer {
        text-align: center;
        font-size: 12px;
        color: #6b7280;
        margin-top: 60px;
        border-top: 1px solid #e5e7eb;
        padding-top: 20px;
    }

    .currency {
        font-family: 'Courier New', monospace;
        font-weight: 600;
    }

    .company-info {
        margin-top: 5px;
    }
    .company-info p {
        margin: 0;
        font-size: 12px;
        color: #6b7280;
    }

    /* Watermark for extra security */
    .watermark {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) rotate(-45deg);
        font-size: 120px;
        color: rgba(229, 231, 235, 0.3);
        z-index: -1;
        font-weight: bold;
        letter-spacing: 5px;
        pointer-events: none;
    }

    .confidential-banner {
        background-color: #fee2e2;
        color: #dc2626;
        text-align: center;
        padding: 5px;
        font-weight: 600;
        font-size: 12px;
        margin-bottom: 20px;
        border-radius: 4px;
    }

    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-bold { font-weight: 600; }
    .mt-10 { margin-top: 10px; }
    .mb-10 { margin-bottom: 10px; }
</style>
