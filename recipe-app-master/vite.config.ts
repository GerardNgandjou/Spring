import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  
  // Clear server configuration
  server: {
    port: 5173,
    host: true, // Allow external access
    open: true, // Open browser automatically
    
    // Proxy configuration for development
    proxy: {
      '/api': {
        target: 'https://localhost:8750',
        changeOrigin: true,
        secure: false, // Bypass SSL verification for localhost
        rewrite: (path) => path.replace(/^\/api/, '/api'),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request:', req.method, req.url);
          });
        }
      }
    }
  },
  
  // Build configuration
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
  
  // Environment variables
  envPrefix: ['VITE_', 'REACT_APP_'],
  
  // Resolve configuration
  resolve: {
    alias: {
      '@': '/src'
    }
  }
})