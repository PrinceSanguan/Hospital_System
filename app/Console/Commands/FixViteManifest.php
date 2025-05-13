<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

class FixViteManifest extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'vite:fix-manifest {--force : Force recreation of manifest even if it exists}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create a fallback Vite manifest file if one does not exist';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $manifestPath = public_path('build/manifest.json');
        $fallbackJsPath = public_path('build/assets/app-fallback.js');
        $fallbackCssPath = public_path('build/assets/app-fallback.css');

        $force = $this->option('force');

        if (File::exists($manifestPath) && !$force) {
            $this->info('Manifest file already exists. Use --force to recreate it.');
            return 0;
        }

        // Ensure directories exist
        File::ensureDirectoryExists(public_path('build/assets'));

        // Create fallback manifest
        $manifest = [
            'resources/css/app.css' => [
                'file' => 'assets/app-fallback.css',
                'isEntry' => true,
                'src' => 'resources/css/app.css'
            ],
            'resources/js/app.tsx' => [
                'file' => 'assets/app-fallback.js',
                'isEntry' => true,
                'src' => 'resources/js/app.tsx'
            ]
        ];

        File::put($manifestPath, json_encode($manifest, JSON_PRETTY_PRINT));
        $this->info('Created fallback manifest file.');

        // Create fallback CSS
        if (!File::exists($fallbackCssPath) || $force) {
            $css = <<<CSS
/* Emergency fallback CSS file */
body:before {
  content: "Warning: Using fallback assets - contact system administrator";
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #ffff99;
  color: #333;
  padding: 10px;
  text-align: center;
  font-family: sans-serif;
  z-index: 9999;
}
CSS;
            File::put($fallbackCssPath, $css);
            $this->info('Created fallback CSS file.');
        }

        // Create fallback JS
        if (!File::exists($fallbackJsPath) || $force) {
            $js = <<<JS
/**
 * Emergency fallback JavaScript file
 * This file is used when the Vite build process fails
 */

console.warn('FALLBACK ASSETS LOADED: The Vite build process failed and fallback assets are being used.');
console.info('Please contact the system administrator if this issue persists.');

// Basic functionality to show an error message to the user
document.addEventListener('DOMContentLoaded', function() {
  // Check if we're in a fallback state
  const isFallback = true;

  if (isFallback) {
    // Create an error message element
    const errorMsg = document.createElement('div');
    errorMsg.style.position = 'fixed';
    errorMsg.style.bottom = '20px';
    errorMsg.style.right = '20px';
    errorMsg.style.backgroundColor = '#f8d7da';
    errorMsg.style.color = '#721c24';
    errorMsg.style.padding = '10px 15px';
    errorMsg.style.borderRadius = '4px';
    errorMsg.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
    errorMsg.style.zIndex = '9999';
    errorMsg.textContent = 'The application is running in fallback mode. Some features may be limited.';

    // Add a close button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.style.marginLeft = '10px';
    closeBtn.style.background = 'none';
    closeBtn.style.border = 'none';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.fontWeight = 'bold';
    closeBtn.onclick = function() {
      errorMsg.remove();
    };

    errorMsg.appendChild(closeBtn);
    document.body.appendChild(errorMsg);
  }
});
JS;
            File::put($fallbackJsPath, $js);
            $this->info('Created fallback JS file.');
        }

        $this->info('Vite manifest fix completed successfully.');
        return 0;
    }
}
