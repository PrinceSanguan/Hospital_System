<?php

namespace App\Providers;

use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Emergency fix for Vite manifest not found error
        $this->fixViteManifest();

        // Register Vite debugger only in non-production environments
        if (app()->environment(['local', 'staging', 'development']) || app()->hasDebugModeEnabled()) {
            $this->registerViteDebugger();
        }
    }

    /**
     * Create emergency Vite manifest file if it doesn't exist
     */
    private function fixViteManifest(): void
    {
        $manifestPath = public_path('build/manifest.json');

        // Only create the manifest if it doesn't exist
        if (!file_exists($manifestPath)) {
            Log::warning('Vite manifest not found. Creating emergency manifest.');

            try {
                // Make sure the directory exists
                if (!is_dir(dirname($manifestPath))) {
                    File::makeDirectory(dirname($manifestPath), 0755, true);
                }

                // Create assets directory if it doesn't exist
                $assetsDir = public_path('build/assets');
                if (!is_dir($assetsDir)) {
                    File::makeDirectory($assetsDir, 0755, true);
                }

                // Create CSS and JS fallback files with timestamps to prevent caching issues
                $timestamp = date('YmdHis');
                $cssFile = "app-fallback-{$timestamp}.css";
                $jsFile = "app-fallback-{$timestamp}.js";

                File::put($assetsDir . '/' . $cssFile, '/* Emergency CSS fallback */');
                File::put($assetsDir . '/' . $jsFile, 'console.log("Emergency JS fallback loaded at ' . $timestamp . '");');

                // Create a basic manifest file
                $manifest = [
                    "resources/css/app.css" => [
                        "file" => "assets/{$cssFile}",
                        "isEntry" => true,
                        "src" => "resources/css/app.css"
                    ],
                    "resources/js/app.tsx" => [
                        "file" => "assets/{$jsFile}",
                        "isEntry" => true,
                        "src" => "resources/js/app.tsx"
                    ]
                ];

                // Write the manifest file
                File::put($manifestPath, json_encode($manifest, JSON_PRETTY_PRINT));

                // Set proper permissions
                chmod($manifestPath, 0644);
                chmod($assetsDir . '/' . $cssFile, 0644);
                chmod($assetsDir . '/' . $jsFile, 0644);

                Log::info('Emergency Vite manifest created at: ' . $manifestPath);
            } catch (\Exception $e) {
                Log::error('Failed to create emergency Vite manifest: ' . $e->getMessage());
            }
        }
    }

    /**
     * Help debug Vite asset loading
     */
    private function registerViteDebugger(): void
    {
        // Add a route to show Vite configuration
        Route::get('/_debug/vite', function () {
            $manifestPath = public_path('build/manifest.json');
            $manifestExists = file_exists($manifestPath);

            return response()->json([
                'manifest_path' => $manifestPath,
                'manifest_exists' => $manifestExists,
                'manifest_content' => $manifestExists ? json_decode(file_get_contents($manifestPath)) : null,
                'public_build_dir_exists' => is_dir(public_path('build')),
                'public_build_contents' => is_dir(public_path('build'))
                    ? array_map(fn($file) => pathinfo($file, PATHINFO_BASENAME), glob(public_path('build/*')))
                    : [],
                'vite_config' => [
                    'buildDirectory' => config('vite.build_directory', 'build'),
                    'hotFile' => config('vite.hot_file', 'hot'),
                ],
            ]);
        });
    }
}
