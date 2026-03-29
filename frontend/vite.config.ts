import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  build: {
    outDir: path.resolve(__dirname, '../src/main/resources/static'),
    emptyOutDir: false
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8080',
      '/transactions': 'http://localhost:8080',
      '/buckets': 'http://localhost:8080',
      '/categorizer': 'http://localhost:8080'
    }
  }
})

