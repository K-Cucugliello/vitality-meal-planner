import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // This tells GitHub Pages where your files actually live
  base: '/vitality-meal-planner/', 
})