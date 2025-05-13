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

    {{-- Safely load Vite assets with fallback --}}
    @php
    function safeVite($assets)
    {
        try {
            if (app()->environment('local')) {
                echo app('\\Illuminate\\Foundation\\Vite')($assets);
            } else {
                // In production, directly include files if manifest exists
                $manifest = public_path('build/manifest.json');
                if (file_exists($manifest)) {
                    $manifestData = json_decode(file_get_contents($manifest), true);
                    foreach ((array)$assets as $asset) {
                        if (isset($manifestData[$asset])) {
                            $file = $manifestData[$asset]['file'] ?? '';
                            if (str_ends_with($asset, '.css')) {
                                echo '<link rel="stylesheet" href="/build/' . $file . '">';
                            }
                            if (str_ends_with($asset, '.js') || str_ends_with($asset, '.tsx')) {
                                echo '<script type="module" src="/build/' . $file . '"></script>';
                            }
                        } else {
                            // Fallback to emergency files
                            if (str_ends_with($asset, '.css')) {
                                echo '<link rel="stylesheet" href="/build/assets/app-fallback.css">';
                            }
                            if (str_ends_with($asset, '.js') || str_ends_with($asset, '.tsx')) {
                                echo '<script src="/build/assets/app-fallback.js"></script>';
                            }
                        }
                    }
                } else {
                    // Manifest not found, use emergency fallbacks
                    foreach ((array)$assets as $asset) {
                        if (str_ends_with($asset, '.css')) {
                            echo '<link rel="stylesheet" href="/build/assets/app-fallback.css">';
                        }
                        if (str_ends_with($asset, '.js') || str_ends_with($asset, '.tsx')) {
                            echo '<script src="/build/assets/app-fallback.js"></script>';
                        }
                    }
                }
            }
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Vite error: ' . $e->getMessage());
            // Fallback if Vite fails
            foreach ((array)$assets as $asset) {
                if (str_ends_with($asset, '.css')) {
                    echo '<link rel="stylesheet" href="/build/assets/app-fallback.css">';
                }
                if (str_ends_with($asset, '.js') || str_ends_with($asset, '.tsx')) {
                    echo '<script src="/build/assets/app-fallback.js"></script>';
                }
            }
        }
    }
    @endphp

    {{-- React refresh --}}
    @if(app()->environment('local'))
        @viteReactRefresh
    @endif

    {{-- Use safe Vite helper --}}
    {!! safeVite(['resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"]) !!}
    {!! safeVite(['resources/css/app.css']) !!}
    @inertiaHead

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
