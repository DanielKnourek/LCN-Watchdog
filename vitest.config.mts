import { join } from "path";
import tsconfigPaths from 'vite-tsconfig-paths';
import { configDefaults, defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
    globals: true,
    coverage: {
      provider: "v8",
      all: true,
      reporter: ["text", "json", "html"],
      reportsDirectory: './coverage',
      include: ['src/**'],
      exclude: [
        'src/server/api/trpc.ts',
        'src/server/auth.ts',
      ],
      // lines: 75,
      // functions: 75,
    },
    exclude: [...configDefaults.exclude, "**/e2e/**"],
    
    alias: {
      "~/": join(__dirname, "./src/"),
    },
  },
})