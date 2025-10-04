import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@story': path.resolve(__dirname, 'src'),
      '@schemas': path.resolve(__dirname, '..', '..', 'services', 'narrative-service', 'schemas'),
      '@services': path.resolve(__dirname, '..', '..', 'services'),
      '@root': path.resolve(__dirname, '..', '..'),
    },
  },
  server: {
    port: 5174,
    strictPort: true,
    host: '0.0.0.0',
    open: false,
    fs: {
      // allow importing files from the monorepo root (../../)
      allow: [path.resolve(__dirname, '..', '..')],
    },
  },
})
