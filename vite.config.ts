import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Bundle analyzer - generates a visual report of bundle composition
    visualizer({
      open: true, // Open the report in browser after build
      filename: 'dist/bundle-stats.html', // Output file
      gzipSize: true, // Show gzip sizes
      brotliSize: true, // Show brotli sizes
      template: 'treemap' // Options: 'treemap', 'sunburst', 'network'
    })
  ],
  
  // Path resolution
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@services': path.resolve(__dirname, './src/services'),
      '@types': path.resolve(__dirname, './src/types'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@store': path.resolve(__dirname, './src/store')
    }
  },
  
  // Development server configuration
  server: {
    port: 5173,
    strictPort: false,
    host: true, // Allow external connections
    open: true, // Open browser on server start
    cors: true
  },
  
  // Build configuration
  build: {
    outDir: 'dist',
    sourcemap: true, // Generate source maps for debugging
    
    // Rollup options for optimization
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          // React and related libraries
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          
          // Form libraries
          'form-vendor': ['react-hook-form', '@hookform/resolvers', 'zod'],
          
          // Supabase client
          'supabase': ['@supabase/supabase-js'],
          
          // UI libraries
          'ui-vendor': ['sonner', 'class-variance-authority', 'clsx', 'tailwind-merge'],
          
          // State management
          'state': ['zustand', 'immer'],
          
          // Data fetching
          'query': ['@tanstack/react-query']
        },
        
        // Asset file naming
        assetFileNames: (assetInfo) => {
          let extType = assetInfo.name?.split('.').at(1) || 'assets';
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
            extType = 'img';
          }
          return `assets/${extType}/[name]-[hash][extname]`;
        },
        
        // Chunk file naming
        chunkFileNames: 'assets/js/[name]-[hash].js',
        
        // Entry file naming
        entryFileNames: 'assets/js/[name]-[hash].js'
      }
    },
    
    // Chunk size warning limit (in kB)
    chunkSizeWarningLimit: 1000,
    
    // Minification options
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console logs in production
        drop_debugger: true // Remove debugger statements
      }
    },
    
    // CSS code splitting
    cssCodeSplit: true,
    
    // Generate a manifest.json file
    manifest: true,
    
    // Empty outDir on build
    emptyOutDir: true
  },
  
  // CSS configuration
  css: {
    modules: {
      localsConvention: 'camelCase'
    },
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/styles/variables.scss";`
      }
    }
  },
  
  // Dependency optimization
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
      'zustand',
      '@tanstack/react-query'
    ],
    exclude: ['@vite/client', '@vite/env']
  },
  
  // Environment variable prefix
  envPrefix: 'VITE_',
  
  // Enable JSX in .js files
  esbuild: {
    jsxInject: `import React from 'react'`,
    jsxFactory: 'React.createElement',
    jsxFragment: 'React.Fragment'
  }
})