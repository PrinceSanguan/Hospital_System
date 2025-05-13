import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

// Detect the build environment
const isCI = process.env.CI === 'true' || process.env.LARAVEL_CLOUD === 'true';

export default defineConfig({
    // Set production mode for Laravel Cloud
    mode: isCI ? 'production' : process.env.NODE_ENV || 'development',

    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.tsx'],
            ssr: 'resources/js/ssr.tsx',
            refresh: true,
            // Make sure the buildDirectory matches Laravel's expectations
            buildDirectory: 'build',
            // Disable hot reloading in CI environments
            hotFile: isCI ? undefined : 'hot',
        }),
        react(),
        tailwindcss(),
    ],
    esbuild: {
        jsx: 'automatic',
    },
    resolve: {
        alias: {
            'ziggy-js': resolve(__dirname, 'vendor/tightenco/ziggy'),
        },
    },
    build: {
        // Ensure manifest is created during build
        manifest: true,
        // Set the output directory explicitly
        outDir: 'public/build',
        // Empty the output directory before building
        emptyOutDir: true,
        // Don't fail on esbuild warnings in CI
        reportCompressedSize: !isCI,
        // Increase the build chunk size limit to reduce the number of files
        chunkSizeWarningLimit: 1000,
        // Set minify configuration
        minify: isCI ? 'terser' : 'esbuild',
        // Set source maps
        sourcemap: !isCI,
    },
    // Increase the log level to see more details in CI environments
    logLevel: isCI ? 'info' : 'warn',
    // Set optimizeDeps configuration
    optimizeDeps: {
        include: ['react', 'react-dom'],
    },
    // Explicit server configuration
    server: {
        hmr: {
            // Force overlay to be off in all environments to prevent issues
            overlay: false,
        },
    },
});
