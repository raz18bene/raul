// ========================================
// CHECKOUT SERVICE - TechLab
// ========================================
// Gestionează coșul de cumpărături și procesarea comenzilor
// Folosește LocalStorage pentru persistență
// Integrare cu Supabase pentru comenzi
// ========================================

class CheckoutService {
    constructor() {
        this.cart = this.loadCart();
        console.log('✓ Checkout service initialized');
    }

    // ========================================
    // COȘUL DE CUMPĂRĂTURI
    // ========================================

    loadCart() {
        try {
            const cartData = localStorage.getItem('shopping_cart');
            return cartData ? JSON.parse(cartData) : [];
        } catch (error) {
            console.error('Error loading cart:', error);
            return [];
        }
    }

    saveCart() {
        try {
            localStorage.setItem('shopping_cart', JSON.stringify(this.cart));
            this.updateCartUI();
        } catch (error) {
            console.error('Error saving cart:', error);
        }
    }

    addToCart(product, quantity = 1) {
        try {
            // Verifică dacă produsul există deja în coș
            const existingItem = this.cart.find(item => item.id === product.id);
            
            if (existingItem) {
                // Crește cantitatea
                existingItem.quantity += quantity;
            } else {
                // Adaugă produs nou în coș
                this.cart.push({
                    id: product.id,
                    name: product.name,
                    price: product.price, // Prețul e deja cel corect (sale_price sau price)
                    image: product.images && product.images.length > 0 ? product.images[0] : null,
                    quantity: quantity,
                    sku: product.sku || null
                });
            }

            this.saveCart();
            
            console.log(`✓ Added to cart: ${product.name} (${quantity}x)`);
            return true;
        } catch (error) {
            console.error('Error adding to cart:', error);
            return false;
        }
    }

    removeFromCart(productId) {
        try {
            this.cart = this.cart.filter(item => item.id !== productId);
            this.saveCart();
            console.log(`✓ Removed from cart: ${productId}`);
        } catch (error) {
            console.error('Error removing from cart:', error);
        }
    }

    updateQuantity(productId, quantity) {
        try {
            const item = this.cart.find(item => item.id === productId);
            if (item) {
                if (quantity <= 0) {
                    this.removeFromCart(productId);
                } else {
                    item.quantity = quantity;
                    this.saveCart();
                    console.log(`✓ Updated quantity: ${productId} → ${quantity}`);
                }
            }
        } catch (error) {
            console.error('Error updating quantity:', error);
        }
    }

    clearCart() {
        try {
            this.cart = [];
            this.saveCart();
            console.log('✓ Cart cleared');
        } catch (error) {
            console.error('Error clearing cart:', error);
        }
    }

    getCart() {
        return this.cart;
    }

    getCartTotal() {
        return this.cart.reduce((total, item) => {
            return total + (item.price * item.quantity);
        }, 0);
    }

    getCartCount() {
        return this.cart.reduce((count, item) => {
            return count + item.quantity;
        }, 0);
    }

    updateCartUI() {
        // Actualizează badge-ul din navigation
        const cartCountElements = document.querySelectorAll('.cart-count');
        const count = this.getCartCount();
        
        cartCountElements.forEach(element => {
            element.textContent = count;
            if (count > 0) {
                element.style.display = 'flex';
            } else {
                element.style.display = 'none';
            }
        });

        // Actualizează pagina checkout dacă suntem pe ea
        if (window.location.pathname.includes('checkout.html')) {
            this.renderCheckoutPage();
        }
    }

    // ========================================
    // RENDER CHECKOUT PAGE
    // ========================================

    renderCheckoutPage() {
        const cartItemsContainer = document.getElementById('cart-items');
        const orderSummary = document.getElementById('order-summary');
        
        if (!cartItemsContainer) return;

        // Verifică dacă coșul e gol
        if (this.cart.length === 0) {
            cartItemsContainer.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                    <div style="font-size: 4rem; margin-bottom: 1rem;">🛒</div>
                    <h3>Coșul tău este gol</h3>
                    <p style="margin-bottom: 2rem;">Adaugă produse pentru a continua.</p>
                    <a href="filamente.html" class="btn btn-primary">Explorează Produsele</a>
                </div>
            `;
            if (orderSummary) {
                orderSummary.style.display = 'none';
            }
            return;
        }

        // Renderează produsele din coș
        cartItemsContainer.innerHTML = this.cart.map(item => `
            <div class="cart-item" data-product-id="${item.id}">
                <div class="cart-item-image">
                    <img src="${item.image || 'https://via.placeholder.com/80'}" alt="${item.name}">
                </div>
                <div class="cart-item-details">
                    <h4>${item.name}</h4>
                    <p class="cart-item-price">${item.price} RON</p>
                </div>
                <div class="cart-item-quantity">
                    <button class="quantity-btn" onclick="checkoutService.updateQuantity('${item.id}', ${item.quantity - 1})">-</button>
                    <input type="number" value="${item.quantity}" min="1" 
                           onchange="checkoutService.updateQuantity('${item.id}', parseInt(this.value))">
                    <button class="quantity-btn" onclick="checkoutService.updateQuantity('${item.id}', ${item.quantity + 1})">+</button>
                </div>
                <div class="cart-item-subtotal">
                    ${(item.price * item.quantity).toFixed(2)} RON
                </div>
                <button class="cart-item-remove" onclick="checkoutService.removeFromCart('${item.id}')" title="Elimină">
                    ✕
                </button>
            </div>
        `).join('');

        // Actualizează sumar comandă
        if (orderSummary) {
            const total = this.getCartTotal();
            const shipping = 0; // Shipping gratuit sau calculat
            const finalTotal = total + shipping;

            orderSummary.innerHTML = `
                <h3>Sumar Comandă</h3>
                <div class="summary-row">
                    <span>Subtotal:</span>
                    <span>${total.toFixed(2)} RON</span>
                </div>
                <div class="summary-row">
                    <span>Transport:</span>
                    <span>${shipping === 0 ? 'GRATUIT' : shipping.toFixed(2) + ' RON'}</span>
                </div>
                <div class="summary-row summary-total">
                    <span>Total:</span>
                    <span>${finalTotal.toFixed(2)} RON</span>
                </div>
                <div style="margin-top: 2rem; padding-top: 2rem; border-top: 2px solid var(--border);">
                    <h3 style="color: var(--primary); margin-bottom: 1rem; font-family: var(--font-display);">💳 Metodă Plată</h3>
                    <div class="payment-methods">
                        <label class="payment-method-option">
                            <input type="radio" name="payment-method" value="card" checked>
                            <div class="payment-method-card">
                                <div class="payment-method-icon">💳</div>
                                <div class="payment-method-details">
                                    <strong>Card Online</strong>
                                    <p>Securizat prin Netopia</p>
                                    <div class="payment-badges"><span>🔒</span><span>Visa/MC</span></div>
                                </div>
                            </div>
                        </label>
                        <label class="payment-method-option">
                            <input type="radio" name="payment-method" value="transfer">
                            <div class="payment-method-card">
                                <div class="payment-method-icon">🏦</div>
                                <div class="payment-method-details">
                                    <strong>Transfer Bancar</strong>
                                    <p>Detalii email</p>
                                </div>
                            </div>
                        </label>
                        <label class="payment-method-option">
                            <input type="radio" name="payment-method" value="cash">
                            <div class="payment-method-card">
                                <div class="payment-method-icon">💵</div>
                                <div class="payment-method-details">
                                    <strong>Numerar</strong>
                                    <p>La livrare</p>
                                </div>
                            </div>
                        </label>
                    </div>
                </div>
                <button class="btn btn-primary btn-block" onclick="checkoutService.proceedToPayment()" style="margin-top: 2rem;">
                    Finalizează Comanda
                </button>
            `;
        }
    }

    // ========================================
    // PROCESARE COMANDĂ
    // ========================================

    async processOrder(customerData) {
        try {
            if (this.cart.length === 0) {
                throw new Error('Coșul este gol');
            }

            console.log('📦 Processing order...');

            // 1. Generează număr comandă
            const orderNumber = this.generateOrderNumber();
            console.log(`Order number: ${orderNumber}`);

            // 2. Calculează totalul
            const totalAmount = this.getCartTotal();

            // 3. Pregătește datele comenzii
            const orderData = {
                order_number: orderNumber,
                customer_name: customerData.name,
                customer_email: customerData.email,
                customer_phone: customerData.phone,
                shipping_address: {
                    street: customerData.address,
                    city: customerData.city,
                    county: customerData.county,
                    postal_code: customerData.postalCode
                },
                total_amount: totalAmount,
                status: 'pending',
                payment_status: 'pending',
                payment_method: customerData.paymentMethod || 'cash',
                notes: customerData.notes || ''
            };

            // 4. Creează comanda în Supabase
            await ensureSupabaseService();
            const order = await supabaseService.createOrder(orderData);
            console.log('✓ Order created in database');

            // 5. Creează items pentru comandă
            const orderItems = this.cart.map(item => ({
                order_id: order.id,
                product_id: item.id,
                product_name: item.name,
                product_price: item.price,
                quantity: item.quantity,
                subtotal: item.price * item.quantity
            }));

            await supabaseService.createOrderItems(orderItems);
            console.log('✓ Order items created');

            // 6. Actualizează stocul produselor
            for (const item of this.cart) {
                try {
                    await supabaseService.updateProductStock(item.id, item.quantity);
                } catch (error) {
                    console.warn(`Could not update stock for ${item.id}:`, error);
                }
            }

            // 7. Scade stoc in Oblio (async, non-blocking)
            try {
                await fetch('/api/oblio?action=decrease-stock', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        orderNumber,
                        items: this.cart.map(item => ({
                            name: item.name,
                            code: item.code || item.id || '',
                            quantity: item.quantity,
                            price: item.price,
                        }))
                    })
                });
                console.log('\u2713 Oblio stock decreased');
            } catch (oblioErr) {
                console.warn('Oblio stock update failed (non-critical):', oblioErr);
            }

            // 8. NU goleste cosul (se face dupa plata)
            return {
                success: true,
                orderId: order.id,
                orderNumber: orderNumber
            };
        } catch (error) {
            console.error('❌ Order processing error:', error);
            throw error;
        }
    }

    async proceedToPayment() {
        const form = document.getElementById('checkout-form');
        if (!form) return;

        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }

        const paymentMethod = document.querySelector('input[name="payment-method"]:checked')?.value;
        if (!paymentMethod) {
            alert('Alege o metodă de plată!');
            return;
        }

        const customerData = {
            name: document.getElementById('customer-name')?.value,
            email: document.getElementById('customer-email')?.value,
            phone: document.getElementById('customer-phone')?.value,
            address: document.getElementById('customer-address')?.value,
            city: document.getElementById('customer-city')?.value,
            county: document.getElementById('customer-county')?.value,
            postalCode: document.getElementById('customer-postal')?.value,
            notes: document.getElementById('customer-notes')?.value,
            paymentMethod: paymentMethod
        };

        try {
            const orderResult = await this.processOrder(customerData);
            const cart = this.getCart();
            const orderNumber = orderResult.order_number || orderResult.orderNumber;
            const orderData = {
                order_number: orderNumber,
                total_amount: this.getCartTotal(),
                customer_name: customerData.name,
                customer_email: customerData.email,
                customer_phone: customerData.phone,
                shipping_address: customerData.address,
                city: customerData.city,
                county: customerData.county,
                postal_code: customerData.postalCode,
                payment_method: paymentMethod,
                items: cart.map(item => ({
                    name: item.name,
                    code: item.id,
                    price: item.price,
                    quantity: item.quantity,
                })),
            };

            if (paymentMethod === 'card') {
                console.log('💳 Card → Netopia');
                if (typeof handleNetopiaCheckout === 'function') {
                    await handleNetopiaCheckout(orderData);
                } else {
                    console.error('handleNetopiaCheckout not found');
                    alert('Eroare: funcția de plată nu este disponibilă');
                }
            } else {
                console.log('💵 ' + paymentMethod);
                this.clearCart();
                window.location.href = 'payment-return.html?order=' + orderNumber + '&method=' + paymentMethod;
            }
        } catch (error) {
            alert('Eroare la procesarea comenzii: ' + error.message);
            console.error(error);
        }
    }

    // ========================================
    // VERIFICARE STATUS COMANDĂ
    // ========================================

    async getOrderStatus(orderNumber) {
        try {
            await ensureSupabaseService();
            const order = await supabaseService.getOrderByNumber(orderNumber);
            return {
                success: true,
                order: order
            };
        } catch (error) {
            console.error('Order status error:', error);
            return {
                success: false,
                message: 'Nu s-a putut găsi comanda'
            };
        }
    }

    // ========================================
    // UTILITARE
    // ========================================

    generateOrderNumber() {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `ORD-${timestamp}-${random}`;
    }

    formatPrice(price) {
        return `${parseFloat(price).toFixed(2)} RON`;
    }
}

// ========================================
// INIȚIALIZARE GLOBALĂ
// ========================================

const checkoutService = new CheckoutService();

// Actualizează UI la încărcarea paginii
document.addEventListener('DOMContentLoaded', () => {
    checkoutService.updateCartUI();
    console.log(`🛒 Cart: ${checkoutService.getCartCount()} items`);
});

// Export pentru uz global
window.checkoutService = checkoutService;