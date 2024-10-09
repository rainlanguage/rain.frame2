import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './')
		}
	},

	test: {
		includeSource: ['./**/*.{js, ts, tsx}'],
		globals: true,
		environment: 'jsdom',
		include: ['./**/*.{test,spec}.{tsx, ts}'],
		setupFiles: ['./__tests__/vitest.setup.ts']
	}
});
