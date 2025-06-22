import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/', // Ensure proper base URL for Firebase Hosting
  server: {
    // Let Vite handle HMR automatically for best performance
    hmr: true,
    // Uncomment if you're on Windows and have file watching issues
    watch: {
      usePolling: process.platform === 'win32',
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false, // Disable source maps in production for security
    minify: 'esbuild', // Use esbuild for faster builds
    target: 'es2020', // Modern browsers support
    cssCodeSplit: true, // Split CSS for better caching
    rollupOptions: {
      output: {
        // Optimize chunk splitting for better caching
        manualChunks: {
          vendor: ['react', 'react-dom'],
          firebase: ['firebase/app', 'firebase/firestore', 'firebase/auth'],
          router: ['react-router-dom'],
          icons: ['react-icons'],
          utils: ['clsx', 'tailwind-merge', 'date-fns'],
        },
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]',
      },
    },
    // Increase chunk size warning limit for Firebase
    chunkSizeWarningLimit: 1000,
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'firebase/app',
      'firebase/firestore',
      'firebase/auth',
    ],
  },
  // Define environment variables for build
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
  },
});
