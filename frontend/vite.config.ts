import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Build output will be the Spring Boot static resources folder
export default defineConfig({
  plugins: [react()],
  build: {
    // change outDir to point to the top-level server static resources (one level up from frontend)
    outDir: path.resolve(__dirname, '../src/main/resources/static'),
    emptyOutDir: false
  },
  server: {
    port: 5173,
    // Proxy API calls to the Spring Boot backend (running on :8080)
    proxy: {
      '/buckets': {
        target: 'http://localhost:8080',
        changeOrigin: true
      },
      '/transactions': {
        target: 'http://localhost:8080',
        changeOrigin: true
      },
      '/categorizer': {
        target: 'http://localhost:8080',
        changeOrigin: true
      },
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  }
})
