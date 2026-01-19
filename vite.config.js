import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Use './' to make all paths relative. 
  // This is the most "fail-safe" way for GitHub Pages and Vercel.
  base: './', 
})