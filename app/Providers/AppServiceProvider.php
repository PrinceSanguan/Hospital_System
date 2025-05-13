<?php

namespace App\Providers;

use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

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
        // Register Vite debugger only in non-production environments
        if (app()->environment(['local', 'staging', 'development']) || app()->hasDebugModeEnabled()) {
            $this->registerViteDebugger();
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
