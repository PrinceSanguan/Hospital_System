<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;

class FixViteManifest extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'vite:fix-manifest {--force : Force creation even if manifest exists}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create an emergency Vite manifest file to prevent 500 errors';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $manifestPath = public_path('build/manifest.json');
        $force = $this->option('force');

        if (file_exists($manifestPath) && !$force) {
            $this->info('Vite manifest file already exists at: ' . $manifestPath);

            if ($this->confirm('Do you want to replace it anyway?')) {
                $force = true;
            } else {
                return 0;
            }
        }

        if (!file_exists($manifestPath) || $force) {
            $this->info('Creating emergency Vite manifest file...');

            // Make sure the build directory exists
            if (!is_dir(dirname($manifestPath))) {
                $this->info('Creating build directory...');
                File::makeDirectory(dirname($manifestPath), 0755, true);
            }

            // Create assets directory if it doesn't exist
            $assetsDir = public_path('build/assets');
            if (!is_dir($assetsDir)) {
                $this->info('Creating assets directory...');
                File::makeDirectory($assetsDir, 0755, true);
            }

            // Create CSS and JS fallback files
            $this->info('Creating fallback CSS and JS files...');
            File::put($assetsDir . '/app-fallback.css', '/* Emergency CSS fallback */');
            File::put($assetsDir . '/app-fallback.js', 'console.log("Emergency JS fallback loaded");');

            // Create a basic manifest file
            $manifest = [
                "resources/css/app.css" => [
                    "file" => "assets/app-fallback.css",
                    "isEntry" => true,
                    "src" => "resources/css/app.css"
                ],
                "resources/js/app.tsx" => [
                    "file" => "assets/app-fallback.js",
                    "isEntry" => true,
                    "src" => "resources/js/app.tsx"
                ]
            ];

            // Write the manifest file
            File::put($manifestPath, json_encode($manifest, JSON_PRETTY_PRINT));

            // Set correct permissions
            chmod($manifestPath, 0644);
            chmod($assetsDir . '/app-fallback.css', 0644);
            chmod($assetsDir . '/app-fallback.js', 0644);

            $this->info('Emergency Vite manifest created at: ' . $manifestPath);
            Log::info('Emergency Vite manifest created by command at: ' . $manifestPath);

            return 0;
        }

        return 1;
    }
}
