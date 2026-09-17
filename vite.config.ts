import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { aiProxyPlugin } from './server/aiProxyPlugin'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), aiProxyPlugin()],
})
