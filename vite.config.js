import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        laravel({
            input: ['resources/js/app.tsx'],
            refresh: true,
        }),
        react(),
    ],
    build: {
        // Ensure we're generating proper chunks and handling dependencies
        rollupOptions: {
            output: {
                manualChunks: {
                    // Split vendor code into separate chunks
                    vendor: [
                        'react',
                        'react-dom',
                        '@inertiajs/react',
                        'lucide-react',
                    ],
                    // Put all Radix UI components in a separate chunk
                    radix: [
                        '@radix-ui/react-switch',
                        '@radix-ui/react-avatar',
                        '@radix-ui/react-checkbox',
                        '@radix-ui/react-dialog',
                        '@radix-ui/react-label',
                        '@radix-ui/react-slot',
                        '@radix-ui/react-tabs',
                    ],
                },
            },
        },
    },
    resolve: {
        alias: {
            '@': '/resources/js',
        },
    },
});
