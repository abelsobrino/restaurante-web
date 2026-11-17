import React, { useLayoutEffect, useRef } from 'react';
import { createPageScope } from './scope.js';

// Isla de compatibilidad: React gestiona el montaje y desmontaje; la lógica
// original controla exclusivamente sus descendientes. Esto evita que React
// sobrescriba formularios, mapas, modales y listas que ya funcionan.
export function PageView({ html, controllers, routeUrl, navigate, onError }) {
    const host = useRef(null);
    useLayoutEffect(() => {
        const scope = createPageScope(host.current, routeUrl, navigate, onError);
        try {
            for (const setup of controllers) setup(scope);
            scope.start();
        } catch (error) { onError(error); }
        return () => scope.dispose();
    }, [html, controllers, routeUrl, navigate, onError]);
    return <div ref={host} data-lafonda-page="" style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: html }} />;
}
