import test from 'node:test';
import assert from 'node:assert/strict';
import { prepareRoute, activateStyles, stylesReady } from '../src/runtime/resources.js';

test('precargar otra sección no desactiva el CSS vigente hasta el montaje de la nueva', async () => {
    const links = [];
    const original = globalThis.document;
    globalThis.document = {
        createElement: () => ({ rel: '', href: '', media: '', dataset: {}, sheet: { cssRules: [] } }),
        querySelectorAll: selector => selector === 'link[data-route-style]' ? links : [],
        head: {
            insertBefore(link, after) {
                const index = after ? links.indexOf(after) : -1;
                if (index >= 0) links.splice(index, 0, link);
                else links.push(link);
                queueMicrotask(() => link.onload?.());
            }
        }
    };
    try {
        const a = { path: '/test-ruta-a/', styles: ['/test-estilo-a.css'], leaflet: false, load: async () => ({ default: () => null }) };
        const b = { path: '/test-ruta-b/', styles: ['/test-estilo-b.css'], leaflet: false, load: async () => ({ default: () => null }) };
        await prepareRoute(a);
        activateStyles(a.styles);
        assert.equal(stylesReady(a.styles), true);
        const oldLink = links.find(link => link.href === `${a.styles[0]}?v=2.0.8`);
        assert.equal(oldLink.media, 'all');
        // Esta precarga no toca la hoja visible.
        await prepareRoute(b);
        assert.equal(oldLink.media, 'all');
        assert.equal(stylesReady(b.styles), false);
        activateStyles(b.styles);
        assert.equal(oldLink.media, 'not all');
        assert.equal(stylesReady(b.styles), true);
        assert.equal(stylesReady(a.styles), false);
    } finally {
        if (original === undefined) delete globalThis.document;
        else globalThis.document = original;
    }
});
