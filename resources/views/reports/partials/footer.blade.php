<div class="footer">
    <p>© {{ date('Y') }} Famcare Clinic Management System. All rights reserved.</p>
    <p>This report is confidential and contains proprietary information intended for authorized personnel only.</p>
    <p>Generated on: {{ now()->format('F j, Y \a\t g:i a') }} | www.chorosclinic.com</p>
</div>

<script type="text/php">
    if (isset($pdf)) {
        $pdf->page_script('
            $font = $fontMetrics->get_font("Arial", "normal");
            $pdf->text(270, 800, "Page $PAGE_NUM of $PAGE_COUNT", $font, 10);
        ');
    }
</script>
