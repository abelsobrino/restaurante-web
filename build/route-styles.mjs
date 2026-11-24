import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const pagesRoot = resolve(root, 'public/paginas');
export const bundleFile = resolve(root, 'src/styles/route-pages.css');

function findCssFiles(directory) {
    return readdirSync(directory, { withFileTypes: true })
        .flatMap(entry => {
            const file = resolve(directory, entry.name);
            if (entry.isDirectory()) return findCssFiles(file);
            if (entry.isFile() && entry.name.endsWith('.css')) return [file];
            return [];
        })
        .sort();
}

export function getPageCssFiles() {
    // Los CSS base están en index.html. Estos estilos de página permanecen
    // activos durante toda la sesión para que React nunca pinte sin CSS.
    return [resolve(root, 'public/inicio.css'), ...findCssFiles(pagesRoot)];
}

export function generateRouteStyles() {
    const styles = '/* Generado automáticamente desde public/inicio.css y public/paginas. NO EDITAR. */\n' +
        getPageCssFiles().map(file =>
            `/* ${relative(root, file).split(sep).join('/')} */\n${readFileSync(file, 'utf8')}`
        ).join('\n\n') + '\n';
    mkdirSync(dirname(bundleFile), { recursive: true });
    // No crear HMR ni recargas innecesarias cuando no cambió el contenido.
    try { if (readFileSync(bundleFile, 'utf8') === styles) return styles; } catch {}
    writeFileSync(bundleFile, styles);
    return styles;
}

export function lafondaPageStyles() {
    return {
        name: 'lafonda-page-styles',
        buildStart() {
            generateRouteStyles();
            getPageCssFiles().forEach(file => this.addWatchFile(file));
        },
        configureServer(server) {
            server.watcher.add(getPageCssFiles());
            server.watcher.on('change', file => {
                if (getPageCssFiles().includes(file)) generateRouteStyles();
            });
        }
    };
}
