import { defineConfig } from 'vite';
import { lafondaPageStyles } from './build/route-styles.mjs';

export default defineConfig({
    plugins: [lafondaPageStyles()],
    build: { sourcemap: false },
    server: { port: 5173 },
    preview: { port: 4173 }
});
