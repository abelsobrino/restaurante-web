import React from "react";
export default function Footer({ className = "" }) { return <div id="global-footer" className={className}>
<footer className="main-footer">

    <div className="container footer-social">

        <p className="social-title">
            Síguenos en nuestras redes sociales
        </p>

        <div className="social-icons">

            <a
                href="https://www.instagram.com/lafonda_fastfood?utm_source=ig_web_button_share_sheet&stkn=ZDNlZDc0MzIxNw=="
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                title="Instagram"
            >
                <i className="fa-brands fa-instagram"></i>
            </a>

            <a
                href="https://www.facebook.com/LaFondaFastFood?locale=es_LA"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                title="Facebook"
            >
                <i className="fa-brands fa-facebook"></i>
            </a>

            <a
                href="https://wa.me/51943358398"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                title="WhatsApp"
            >
                <i className="fa-brands fa-whatsapp"></i>
            </a>

            <a
                href="https://www.tiktok.com/@lafondafastfood?is_from_webapp=1&sender_device=pc"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
                title="TikTok"
            >
                <i className="fa-brands fa-tiktok"></i>
            </a>

        </div>

    </div>

    <div className="container footer-info">
        <p>
            &copy; 2026
            <span className="highlight">La Fonda</span>.
            Todos los derechos reservados.
        </p>
    </div>

</footer>

</div>; }
