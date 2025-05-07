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
        // Increase memory limit
        chunkSizeWarningLimit: 1000,
        // Skip specific dependencies that might cause issues
        commonjsOptions: {
            include: [/node_modules/],
            extensions: ['.js', '.cjs'],
            strictRequires: true,
            transformMixedEsModules: true,
        },
        rollupOptions: {
            // Manually identify externals
            external: [],
            output: {
                manualChunks: (id) => {
                    // Put React and related packages in vendor chunk
                    if (id.includes('node_modules/react') ||
                        id.includes('node_modules/react-dom')) {
                        return 'vendor-react';
                    }

                    // Put Radix UI components in a separate chunk
                    if (id.includes('node_modules/@radix-ui')) {
                        return 'vendor-radix';
                    }

                    // Other vendors
                    if (id.includes('node_modules')) {
                        return 'vendor';
                    }
                },
            },
        },
    },
    resolve: {
        alias: {
            '@': '/resources/js',
        },
    },
    optimizeDeps: {
        include: ['react', 'react-dom'],
        exclude: ['@radix-ui/react-switch'],
    }
});
