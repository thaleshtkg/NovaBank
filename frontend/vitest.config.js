import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// frontend/node_modules — needed when resolving packages for test files
// that live outside the frontend/ root (AutomationTests/frontend/)
const nm = (pkg) => path.resolve(__dirname, 'node_modules', pkg);

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.js'],
    include: ['../AutomationTests/frontend/**/*.test.{js,jsx}'],
    css: false,
  },
  resolve: {
    alias: {
      // Source alias for test files using @/... imports
      '@': path.resolve(__dirname, 'src'),
      // Explicitly resolve React packages from frontend/node_modules/ so that
      // test files outside the frontend/ root can find them.
      'react': nm('react'),
      'react-dom': nm('react-dom'),
      'react/jsx-runtime': nm('react/jsx-runtime.js'),
      'react/jsx-dev-runtime': nm('react/jsx-dev-runtime.js'),
      'react-router-dom': nm('react-router-dom'),
      'react-hot-toast': nm('react-hot-toast'),
      'axios': nm('axios'),
      'recharts': nm('recharts'),
      'lucide-react': nm('lucide-react'),
      '@testing-library/react': nm('@testing-library/react'),
      '@testing-library/user-event': nm('@testing-library/user-event'),
      '@testing-library/jest-dom': nm('@testing-library/jest-dom'),
    },
  },
  server: {
    fs: {
      allow: ['..'],
    },
  },
});
