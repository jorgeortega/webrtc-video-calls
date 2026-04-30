import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test/setup.ts',
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        include: ['src/**/*.{ts,tsx}'],
        exclude: [
          'src/main.tsx',
          'src/types.ts',
          'src/vite-env.d.ts',
          'src/test/**',
          '**/*.d.ts',
        ],
        all: true,
        thresholds: {
          lines: 93,
          functions: 92,
          branches: 80,
          statements: 92,
        },
      },
    },
  })
);
