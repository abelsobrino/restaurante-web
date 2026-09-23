// router.js
const routes = {
    '/': '/pages/home.html',
    '/sobre-nosotros': '/pages/sobrenosotros.html',
    '/carta': '/pages/carta.html'
};

async function navigate(path) {
    window.history.pushState({}, path, window.location.origin + path);
    const content = await fetch(routes[path]).then(res => res.text());
    document.getElementById('app').innerHTML = content;
}

// Interceptar clics en todos los enlaces
document.addEventListener('click', e => {
    if (e.target.matches('[data-link]')) {
        e.preventDefault();
        navigate(e.target.getAttribute('href'));
    }
});