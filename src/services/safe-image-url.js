// Atributos <img> alimentados por contenido de la base de datos o del usuario.
// Solo se aceptan URLs HTTPS, rutas locales y fotografías en formatos raster.
// Nunca se aceptan protocolos ejecutables ni SVG incrustado mediante data:.
export function safeGalleryImageURL(value) {
    const url = String(value ?? '').trim();
    if (/^data:image\/(?:png|jpeg|webp|gif);base64,[a-z0-9+/=]+$/i.test(url)) return url;
    if (/^https:\/\/[^\s"'<>]+$/i.test(url)) return url;
    if (/^\/(?!\/)[a-z0-9_/%.\-~]+$/i.test(url)) return url;
    return '/imagenes/logo/logo.webp';
}
