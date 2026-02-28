import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		globals: true,
		environment: 'node',
		passWithNoTests: true,
		coverage: {
			provider: 'v8',
			include: ['packages/*/src/**/*.ts'],
			exclude: [
				'**/node_modules/**',
				'**/dist/**',
				'**/*.test.ts',
				'**/*.spec.ts',
				'**/__tests__/**',
				'**/*.d.ts',
				'**/index.ts',
			],
			reporter: ['text', 'json', 'html', 'lcov'],
			thresholds: {
				statements: 80,
				branches: 80,
				functions: 80,
				lines: 80,
			},
		},
		testTimeout: 10000,
		hookTimeout: 10000,
	},
});
