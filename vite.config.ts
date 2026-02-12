import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Polyfill process.env for compatibility with existing code if needed
    // However, we are handling API_KEY in index.html for now
  }
});