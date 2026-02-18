import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          chart: ['chart.js', 'react-chartjs-2'],
          xlsx: ['xlsx'],
          pdf: ['pdfjs-dist'],
          firebase: ['firebase/app', 'firebase/firestore'],
        },
      },
    },
  },
})
