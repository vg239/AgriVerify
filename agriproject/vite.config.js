import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { Buffer } from 'buffer'

export default defineConfig({
  plugins: [react()],
  define: {
    'global': {},
    'globalThis.Buffer': JSON.stringify(Buffer),
  }
})