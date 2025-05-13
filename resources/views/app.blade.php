<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    {{-- Removed dark mode detection script --}}

    {{-- Inline style to set the HTML background color for white mode --}}
    <style>
        html {
            background-color: oklch(1 0 0);
        }
    </style>

    <title inertia>{{ config('app.name', 'Laravel') }}</title>

    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />

    @routes
    @viteReactRefresh
    @vite(['resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
    @inertiaHead

    @vite(['resources/css/app.css', 'resources/js/app.tsx'])

    {{-- Debug information for Vite in non-production environments --}}
    @if(app()->environment(['local', 'staging', 'development']) || app()->hasDebugModeEnabled())
        <script>
            // Display Vite loading debug info
            console.log('Vite Debug Info:', {
                'env': '{{ app()->environment() }}',
                'manifest_path': '{{ public_path('build/manifest.json') }}',
                'manifest_exists': {{ file_exists(public_path('build/manifest.json')) ? 'true' : 'false' }},
                'vite_hot_exists': {{ file_exists(public_path('hot')) ? 'true' : 'false' }},
                'public_build_dir_exists': {{ is_dir(public_path('build')) ? 'true' : 'false' }}
            });
        </script>
    @endif
</head>

<body class="font-sans antialiased">
    @inertia
</body>

</html>
