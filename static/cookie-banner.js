/* ============================================
   COOKIE BANNER - GDPR COMPLIANT
   ============================================ */

// Cookie Banner HTML & CSS
const cookieBannerHTML = `
<div id="cookie-banner" class="cookie-banner">
    <div class="cookie-content">
        <div class="cookie-icon">🍪</div>
        <div class="cookie-text">
            <h3>Folosim Cookie-uri</h3>
            <p>Acest site folosește cookie-uri pentru a îmbunătăți experiența ta de navigare. Cookie-urile esențiale sunt necesare pentru funcționarea site-ului, în timp ce cookie-urile de performanță și marketing necesită acordul tău.</p>
            <a href="politica-confidentialitate.html#cookies" target="_blank">Citește Politica de Cookies</a>
        </div>
        <div class="cookie-buttons">
            <button id="cookie-accept-all" class="cookie-btn cookie-btn-primary">
                ✓ Acceptă Toate
            </button>
            <button id="cookie-accept-essential" class="cookie-btn cookie-btn-secondary">
                Doar Esențiale
            </button>
            <button id="cookie-settings" class="cookie-btn cookie-btn-text">
                ⚙️ Setări
            </button>
        </div>
    </div>
</div>

<div id="cookie-settings-modal" class="cookie-modal">
    <div class="cookie-modal-content">
        <div class="cookie-modal-header">
            <h2>Setări Cookie-uri</h2>
            <button id="cookie-modal-close" class="cookie-close">&times;</button>
        </div>
        <div class="cookie-modal-body">
            <div class="cookie-category">
                <div class="cookie-category-header">
                    <label class="cookie-switch">
                        <input type="checkbox" id="cookie-essential" checked disabled>
                        <span class="cookie-slider"></span>
                    </label>
                    <div>
                        <h4>Cookie-uri Esențiale</h4>
                        <p>Necesare pentru funcționarea site-ului (coș, sesiune, autentificare)</p>
                    </div>
                </div>
            </div>
            
            <div class="cookie-category">
                <div class="cookie-category-header">
                    <label class="cookie-switch">
                        <input type="checkbox" id="cookie-performance">
                        <span class="cookie-slider"></span>
                    </label>
                    <div>
                        <h4>Cookie-uri de Performanță</h4>
                        <p>Analizează traficul și comportamentul pentru îmbunătățirea site-ului (Google Analytics)</p>
                    </div>
                </div>
            </div>
            
            <div class="cookie-category">
                <div class="cookie-category-header">
                    <label class="cookie-switch">
                        <input type="checkbox" id="cookie-marketing">
                        <span class="cookie-slider"></span>
                    </label>
                    <div>
                        <h4>Cookie-uri de Marketing</h4>
                        <p>Publicitate țintită și remarketing (Facebook Pixel, Google Ads)</p>
                    </div>
                </div>
            </div>
        </div>
        <div class="cookie-modal-footer">
            <button id="cookie-save-settings" class="cookie-btn cookie-btn-primary">
                Salvează Setările
            </button>
            <button id="cookie-accept-all-modal" class="cookie-btn cookie-btn-secondary">
                Acceptă Toate
            </button>
        </div>
    </div>
</div>
`;

const cookieBannerCSS = `
/* Cookie Banner */
.cookie-banner {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: var(--bg-card);
    border-top: 2px solid var(--primary);
    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.3);
    z-index: 9999;
    padding: 1.5rem;
    animation: slideUp 0.5s ease;
}

@keyframes slideUp {
    from { transform: translateY(100%); }
    to { transform: translateY(0); }
}

.cookie-content {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    gap: 2rem;
    flex-wrap: wrap;
}

.cookie-icon {
    font-size: 3rem;
}

.cookie-text {
    flex: 1;
    min-width: 300px;
}

.cookie-text h3 {
    font-family: var(--font-display);
    color: var(--primary);
    margin: 0 0 0.5rem 0;
    font-size: 1.3rem;
}

.cookie-text p {
    color: var(--text-secondary);
    margin: 0 0 0.5rem 0;
    line-height: 1.6;
}

.cookie-text a {
    color: var(--primary);
    text-decoration: underline;
    font-size: 0.9rem;
}

.cookie-buttons {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
}

.cookie-btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 1rem;
}

.cookie-btn-primary {
    background: var(--primary);
    color: var(--bg-darker);
}

.cookie-btn-primary:hover {
    background: var(--primary-hover);
    transform: translateY(-2px);
}

.cookie-btn-secondary {
    background: var(--bg-darker);
    color: var(--text-primary);
    border: 1px solid var(--border);
}

.cookie-btn-secondary:hover {
    background: var(--bg-card);
}

.cookie-btn-text {
    background: transparent;
    color: var(--text-secondary);
}

.cookie-btn-text:hover {
    color: var(--primary);
}

/* Cookie Modal */
.cookie-modal {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    z-index: 10000;
    align-items: center;
    justify-content: center;
    padding: 2rem;
}

.cookie-modal.active {
    display: flex;
}

.cookie-modal-content {
    background: var(--bg-card);
    border-radius: 16px;
    max-width: 600px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 10px 50px rgba(0, 0, 0, 0.5);
}

.cookie-modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 2rem;
    border-bottom: 1px solid var(--border);
}

.cookie-modal-header h2 {
    font-family: var(--font-display);
    color: var(--primary);
    margin: 0;
}

.cookie-close {
    background: none;
    border: none;
    font-size: 2rem;
    color: var(--text-secondary);
    cursor: pointer;
    transition: color 0.3s ease;
}

.cookie-close:hover {
    color: var(--error);
}

.cookie-modal-body {
    padding: 2rem;
}

.cookie-category {
    margin-bottom: 2rem;
    padding: 1.5rem;
    background: var(--bg-darker);
    border: 1px solid var(--border);
    border-radius: 12px;
}

.cookie-category-header {
    display: flex;
    gap: 1rem;
    align-items: flex-start;
}

.cookie-category h4 {
    color: var(--text-primary);
    margin: 0 0 0.5rem 0;
    font-size: 1.1rem;
}

.cookie-category p {
    color: var(--text-secondary);
    margin: 0;
    font-size: 0.9rem;
    line-height: 1.5;
}

/* Toggle Switch */
.cookie-switch {
    position: relative;
    display: inline-block;
    width: 50px;
    height: 24px;
    flex-shrink: 0;
}

.cookie-switch input {
    opacity: 0;
    width: 0;
    height: 0;
}

.cookie-slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: var(--border);
    transition: 0.4s;
    border-radius: 24px;
}

.cookie-slider:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: 0.4s;
    border-radius: 50%;
}

input:checked + .cookie-slider {
    background-color: var(--primary);
}

input:checked + .cookie-slider:before {
    transform: translateX(26px);
}

input:disabled + .cookie-slider {
    opacity: 0.5;
    cursor: not-allowed;
}

.cookie-modal-footer {
    display: flex;
    gap: 1rem;
    padding: 2rem;
    border-top: 1px solid var(--border);
    justify-content: flex-end;
}

/* Mobile Responsive */
@media (max-width: 768px) {
    .cookie-content {
        flex-direction: column;
        text-align: center;
    }
    
    .cookie-buttons {
        width: 100%;
        flex-direction: column;
    }
    
    .cookie-btn {
        width: 100%;
    }
    
    .cookie-modal-footer {
        flex-direction: column;
    }
}
`;

// Cookie Manager
class CookieManager {
    constructor() {
        this.cookieConsent = this.getCookie('cookie_consent');
        this.init();
    }

    init() {
        // Inject CSS
        const style = document.createElement('style');
        style.textContent = cookieBannerCSS;
        document.head.appendChild(style);

        // Show banner if no consent
        if (!this.cookieConsent) {
            this.showBanner();
        } else {
            // Load cookies based on consent
            this.loadCookies(JSON.parse(this.cookieConsent));
        }

        // Add event listeners
        this.addEventListeners();
    }

    showBanner() {
        const banner = document.createElement('div');
        banner.innerHTML = cookieBannerHTML;
        document.body.appendChild(banner);
    }

    addEventListeners() {
        // Accept all
        document.addEventListener('click', (e) => {
            if (e.target.id === 'cookie-accept-all' || e.target.id === 'cookie-accept-all-modal') {
                this.acceptAll();
            }
        });

        // Accept essential only
        document.addEventListener('click', (e) => {
            if (e.target.id === 'cookie-accept-essential') {
                this.acceptEssential();
            }
        });

        // Open settings
        document.addEventListener('click', (e) => {
            if (e.target.id === 'cookie-settings') {
                this.openSettings();
            }
        });

        // Close modal
        document.addEventListener('click', (e) => {
            if (e.target.id === 'cookie-modal-close') {
                this.closeSettings();
            }
        });

        // Save settings
        document.addEventListener('click', (e) => {
            if (e.target.id === 'cookie-save-settings') {
                this.saveSettings();
            }
        });

        // Close modal on backdrop click
        document.addEventListener('click', (e) => {
            if (e.target.id === 'cookie-settings-modal') {
                this.closeSettings();
            }
        });
    }

    acceptAll() {
        const consent = {
            essential: true,
            performance: true,
            marketing: true
        };
        this.setCookie('cookie_consent', JSON.stringify(consent), 365);
        this.loadCookies(consent);
        this.hideBanner();
    }

    acceptEssential() {
        const consent = {
            essential: true,
            performance: false,
            marketing: false
        };
        this.setCookie('cookie_consent', JSON.stringify(consent), 365);
        this.loadCookies(consent);
        this.hideBanner();
    }

    openSettings() {
        const modal = document.getElementById('cookie-settings-modal');
        if (modal) {
            modal.classList.add('active');
            
            // Load current settings
            if (this.cookieConsent) {
                const consent = JSON.parse(this.cookieConsent);
                document.getElementById('cookie-performance').checked = consent.performance;
                document.getElementById('cookie-marketing').checked = consent.marketing;
            }
        }
    }

    closeSettings() {
        const modal = document.getElementById('cookie-settings-modal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    saveSettings() {
        const consent = {
            essential: true,
            performance: document.getElementById('cookie-performance').checked,
            marketing: document.getElementById('cookie-marketing').checked
        };
        this.setCookie('cookie_consent', JSON.stringify(consent), 365);
        this.loadCookies(consent);
        this.hideBanner();
        this.closeSettings();
    }

    loadCookies(consent) {
        // Essential cookies are always loaded (cart, session)
        // These are already handled by the site

        // Performance cookies (Google Analytics)
        if (consent.performance) {
            this.loadGoogleAnalytics();
        }

        // Marketing cookies (Facebook Pixel, Google Ads)
        if (consent.marketing) {
            this.loadMarketingCookies();
        }
    }

    loadGoogleAnalytics() {
        // TODO: Add Google Analytics tracking code
        console.log('📊 Google Analytics loaded');
        // Example:
        // window.dataLayer = window.dataLayer || [];
        // function gtag(){dataLayer.push(arguments);}
        // gtag('js', new Date());
        // gtag('config', 'GA_MEASUREMENT_ID');
    }

    loadMarketingCookies() {
        // TODO: Add Facebook Pixel, Google Ads
        console.log('📢 Marketing cookies loaded');
    }

    hideBanner() {
        const banner = document.getElementById('cookie-banner');
        if (banner) {
            banner.style.animation = 'slideDown 0.5s ease';
            setTimeout(() => banner.remove(), 500);
        }
    }

    setCookie(name, value, days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        const expires = "expires=" + date.toUTCString();
        document.cookie = name + "=" + value + ";" + expires + ";path=/";
    }

    getCookie(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) == ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }
}

// Add slide down animation
const slideDownKeyframes = `
@keyframes slideDown {
    from { transform: translateY(0); }
    to { transform: translateY(100%); }
}
`;
const animStyle = document.createElement('style');
animStyle.textContent = slideDownKeyframes;
document.head.appendChild(animStyle);

// Initialize Cookie Manager when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new CookieManager();
    });
} else {
    new CookieManager();
}
