

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 TechLab initializing...');
    
    // Core functionality (pe toate paginile)
    initializeHamburgerMenu();
    setActiveNavLink();
    initializeScrollAnimations();
    
    // Page-specific initialization
    const currentPage = getCurrentPage();
    console.log(`📄 Current page: ${currentPage}`);
    
    switch(currentPage) {
        case 'index.html':
            initializeHomePage();
            break;
        case 'filamente.html':
            // Produsele se încarcă prin script inline în pagină
            initializeProductFilters();
            break;
        case 'componente.html':
        case 'print3d.html':
        case 'laser.html':
            // Produsele se încarcă prin script inline în fiecare pagină
            console.log('✓ Product page loaded');
            break;
        case 'contact.html':
            initializeContactForm();
            break;
        case 'checkout.html':
            // Checkout-ul e gestionat de checkout-service.js
            console.log('✓ Checkout page loaded');
            break;
        default:
            console.log('✓ Generic page loaded');
    }
    
    console.log('✅ TechLab initialized successfully!');
});

// ========================================
// UTILITY: GET CURRENT PAGE
// ========================================

function getCurrentPage() {
    const path = window.location.pathname;
    const page = path.split('/').pop() || 'index.html';
    return page === '' ? 'index.html' : page;
}

// ========================================
// HAMBURGER MENU (MOBILE NAVIGATION)
// ========================================

function initializeHamburgerMenu() {
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.querySelector('.nav-links');
    const navOverlay = document.getElementById('nav-overlay');
    const allNavLinks = document.querySelectorAll('.nav-link');
    
    if (!hamburger || !navLinks || !navOverlay) {
        console.warn('⚠️ Hamburger menu elements not found');
        return;
    }
    
    // Toggle menu on hamburger click
    hamburger.addEventListener('click', function(e) {
        e.stopPropagation();
        toggleMenu();
    });
    
    // Close menu on overlay click
    navOverlay.addEventListener('click', function() {
        closeMenu();
    });
    
    // Close menu when clicking a nav link
    allNavLinks.forEach(link => {
        link.addEventListener('click', function() {
            closeMenu();
        });
    });
    
    // Close menu on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && navLinks.classList.contains('active')) {
            closeMenu();
        }
    });
    
    function toggleMenu() {
        const isActive = navLinks.classList.contains('active');
        if (isActive) {
            closeMenu();
        } else {
            openMenu();
        }
    }
    
    function openMenu() {
        hamburger.classList.add('active');
        navLinks.classList.add('active');
        navOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    function closeMenu() {
        hamburger.classList.remove('active');
        navLinks.classList.remove('active');
        navOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    console.log('✓ Hamburger menu initialized');
}

// ========================================
// ACTIVE NAVIGATION HIGHLIGHT
// ========================================

function setActiveNavLink() {
    const currentPage = getCurrentPage();
    
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        const href = link.getAttribute('href');
        
        // Check if link matches current page
        if (href === currentPage) {
            link.classList.add('active');
        }
        
        // Special case for index.html
        if ((currentPage === 'index.html' || currentPage === '') && (href === 'index.html' || href === '/')) {
            link.classList.add('active');
        }
    });
    
    console.log('✓ Active nav link set');
}

// ========================================
// SCROLL ANIMATIONS
// ========================================

function initializeScrollAnimations() {
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            
            // Skip if href is just "#" (no target)
            if (href === '#') return;
            
            e.preventDefault();
            const target = document.querySelector(href);
            
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // Scroll to top button (if exists)
    const scrollToTopBtn = document.getElementById('scroll-to-top');
    if (scrollToTopBtn) {
        window.addEventListener('scroll', function() {
            if (window.pageYOffset > 300) {
                scrollToTopBtn.classList.add('visible');
            } else {
                scrollToTopBtn.classList.remove('visible');
            }
        });
        
        scrollToTopBtn.addEventListener('click', function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
    
    console.log('✓ Scroll animations initialized');
}

// ========================================
// HOME PAGE SPECIFIC
// ========================================

function initializeHomePage() {
    console.log('✓ Initializing home page...');
    
    // Hero section animations
    animateHeroSection();
    
    // Stats counter (if exists)
    initializeStatsCounter();
    
    // Testimonials slider (if exists)
    initializeTestimonialsSlider();
}

function animateHeroSection() {
    const hero = document.querySelector('.hero-section');
    if (hero) {
        hero.classList.add('fade-in');
    }
}

function initializeStatsCounter() {
    const stats = document.querySelectorAll('.stat-number');
    if (stats.length === 0) return;
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                observer.unobserve(entry.target);
            }
        });
    });
    
    stats.forEach(stat => observer.observe(stat));
}

function animateCounter(element) {
    const target = parseInt(element.getAttribute('data-target') || element.textContent);
    const duration = 2000;
    const increment = target / (duration / 16);
    let current = 0;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target;
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current);
        }
    }, 16);
}

function initializeTestimonialsSlider() {
    // TODO: Implement if needed
}

// ========================================
// PRODUCT FILTERS (FILAMENTE PAGE)
// ========================================

function initializeProductFilters() {
    // Filtrele sunt gestionate de script inline în filamente.html
    // care folosește funcția applyFilters() definită acolo
    console.log('✓ Product filters ready (managed by page script)');
}

// ========================================
// CONTACT FORM
// ========================================

function initializeContactForm() {
    const contactForm = document.getElementById('contact-form');
    if (!contactForm) return;
    
    contactForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('contact-name')?.value,
            email: document.getElementById('contact-email')?.value,
            phone: document.getElementById('contact-phone')?.value,
            message: document.getElementById('contact-message')?.value
        };
        
        // Validate
        if (!formData.name || !formData.email || !formData.message) {
            showNotification('Te rugăm să completezi toate câmpurile obligatorii', 'error');
            return;
        }
        
        if (!validateEmail(formData.email)) {
            showNotification('Te rugăm să introduci un email valid', 'error');
            return;
        }
        
        // Submit
        const submitBtn = contactForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Se trimite...';
        submitBtn.disabled = true;
        
        try {
            // TODO: Integrate with backend/email service
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            showNotification('Mesajul tău a fost trimis cu succes! Îți vom răspunde în curând.', 'success');
            contactForm.reset();
        } catch (error) {
            console.error('Error submitting form:', error);
            showNotification('A apărut o eroare. Te rugăm să ne contactezi telefonic.', 'error');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });
    
    console.log('✓ Contact form initialized');
}

// ========================================
// NOTIFICATIONS
// ========================================

function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existing = document.querySelector('.notification');
    if (existing) {
        existing.remove();
    }
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">
                ${type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}
            </span>
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">✕</button>
        </div>
    `;
    
    // Add to DOM
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 300);
    }, 5000);
    
    // Add styles if not already present
    if (!document.getElementById('notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            .notification {
                position: fixed;
                top: 2rem;
                right: 2rem;
                z-index: 10000;
                min-width: 300px;
                max-width: 500px;
                background: var(--bg-card);
                border: 1px solid var(--border);
                border-radius: 12px;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
                animation: slideInRight 0.3s ease-out;
            }
            
            .notification-content {
                display: flex;
                align-items: center;
                gap: 1rem;
                padding: 1rem 1.5rem;
            }
            
            .notification-icon {
                font-size: 1.5rem;
                font-weight: bold;
            }
            
            .notification-success { border-left: 4px solid #10b981; }
            .notification-success .notification-icon { color: #10b981; }
            
            .notification-error { border-left: 4px solid #ef4444; }
            .notification-error .notification-icon { color: #ef4444; }
            
            .notification-info { border-left: 4px solid #3b82f6; }
            .notification-info .notification-icon { color: #3b82f6; }
            
            .notification-message {
                flex: 1;
                color: var(--text-primary);
            }
            
            .notification-close {
                background: transparent;
                border: none;
                color: var(--text-secondary);
                cursor: pointer;
                font-size: 1.2rem;
                padding: 0.25rem;
                transition: color 0.2s;
            }
            
            .notification-close:hover {
                color: var(--text-primary);
            }
            
            .notification.fade-out {
                animation: slideOutRight 0.3s ease-out forwards;
            }
            
            @keyframes slideInRight {
                from {
                    opacity: 0;
                    transform: translateX(100%);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
            
            @keyframes slideOutRight {
                from {
                    opacity: 1;
                    transform: translateX(0);
                }
                to {
                    opacity: 0;
                    transform: translateX(100%);
                }
            }
            
            @media (max-width: 768px) {
                .notification {
                    top: 1rem;
                    right: 1rem;
                    left: 1rem;
                    min-width: auto;
                }
            }
        `;
        document.head.appendChild(styles);
    }
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

// Format price
function formatPrice(price) {
    return `${parseFloat(price).toFixed(2)} RON`;
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ro-RO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Format date and time
function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ro-RO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Validate email
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email.toLowerCase());
}

// Validate phone
function validatePhone(phone) {
    // Romanian phone format: +40 xxx xxx xxx or 07xx xxx xxx
    const re = /^(\+4|0)[0-9]{9}$/;
    return re.test(phone.replace(/\s/g, ''));
}

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Copy to clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showNotification('Copiat în clipboard!', 'success');
    }).catch(err => {
        console.error('Failed to copy:', err);
        showNotification('Eroare la copiere', 'error');
    });
}

// ========================================
// IMAGE LAZY LOADING
// ========================================

if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    });

    document.querySelectorAll('img.lazy').forEach(img => {
        imageObserver.observe(img);
    });
}

// ========================================
// ERROR HANDLING
// ========================================

// Global error handler
window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
    // Don't show error to user in production
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled promise rejection:', e.reason);
    // Don't show error to user in production
});

// ========================================
// CONSOLE MESSAGE
// ========================================

console.log('%c🚀 TechLab Digital Manufacturing', 'font-size: 20px; font-weight: bold; color: #00d9ff;');
console.log('%cPartenerul tău pentru fabricație digitală', 'font-size: 12px; color: #666;');
console.log('%c💻 Developed with ❤️ using Supabase + Vanilla JS', 'font-size: 10px; color: #999;');

// ========================================
// EXPORT FOR GLOBAL USE
// ========================================

// Make utilities available globally
window.TechLab = {
    formatPrice,
    formatDate,
    formatDateTime,
    validateEmail,
    validatePhone,
    showNotification,
    copyToClipboard,
    debounce
};