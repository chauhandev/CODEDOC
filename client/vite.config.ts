import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  root: '.', // Set the correct root
  plugins: [react()],
  build: {
    outDir: '../server/public',
    emptyOutDir: true, 
  },
});
