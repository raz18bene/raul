// Admin Panel JavaScript - CRUD Operations
class AdminPanel {
    constructor() {
        // Folosim Service Role Key pentru operații admin
        this.supabase = supabase.createClient(
            SUPABASE_CONFIG.url,
            SUPABASE_CONFIG.serviceRoleKey
        );
        this.currentProductId = null;
        this.currentCategoryId = null;
        this.categories = [];
        
        this.init();
    }

    async init() {
        await this.loadCategories();
        await this.loadDashboard();
        
        // Event listeners pentru formulare
        document.getElementById('product-form').addEventListener('submit', (e) => this.handleProductSubmit(e));
        document.getElementById('category-form').addEventListener('submit', (e) => this.handleCategorySubmit(e));
    }

    // ===== UTILITARE =====
    showAlert(message, type = 'success') {
        const alertContainer = document.getElementById('alert-container');
        const alertClass = type === 'success' ? 'alert-success' : 'alert-error';
        alertContainer.innerHTML = `
            <div class="alert ${alertClass}">
                ${message}
            </div>
        `;
        
        setTimeout(() => {
            alertContainer.innerHTML = '';
        }, 5000);
    }

    createSlug(text) {
        return text
            .toLowerCase()
            .replace(/ă/g, 'a')
            .replace(/â/g, 'a')
            .replace(/î/g, 'i')
            .replace(/ș/g, 's')
            .replace(/ț/g, 't')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    // ===== DASHBOARD =====
    async loadDashboard() {
        try {
            const [productsResult, ordersResult, categoriesResult] = await Promise.all([
                this.supabase.from('products').select('*'),
                this.supabase.from('orders').select('*'),
                this.supabase.from('categories').select('*')
            ]);

            const products = productsResult.data || [];
            const orders = ordersResult.data || [];
            const categories = categoriesResult.data || [];

            const totalRevenue = orders.reduce((sum, order) => sum + parseFloat(order.total_amount || 0), 0);
            const activeProducts = products.filter(p => p.is_active).length;

            const statsHTML = `
                <div class="stat-card">
                    <h3>Total Produse</h3>
                    <div class="stat-value">${products.length}</div>
                </div>
                <div class="stat-card" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
                    <h3>Produse Active</h3>
                    <div class="stat-value">${activeProducts}</div>
                </div>
                <div class="stat-card" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);">
                    <h3>Categorii</h3>
                    <div class="stat-value">${categories.length}</div>
                </div>
                <div class="stat-card" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);">
                    <h3>Comenzi</h3>
                    <div class="stat-value">${orders.length}</div>
                </div>
                <div class="stat-card" style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);">
                    <h3>Venit Total</h3>
                    <div class="stat-value">${totalRevenue.toFixed(2)} RON</div>
                </div>
            `;

            document.getElementById('stats-container').innerHTML = statsHTML;
        } catch (error) {
            console.error('Error loading dashboard:', error);
            this.showAlert('Eroare la încărcarea dashboard-ului', 'error');
        }
    }

    // ===== CATEGORII =====
    async loadCategories() {
        try {
            const { data, error } = await this.supabase
                .from('categories')
                .select('*')
                .order('name');

            if (error) throw error;

            this.categories = data || [];
            this.renderCategories();
            this.updateCategorySelect();
        } catch (error) {
            console.error('Error loading categories:', error);
            this.showAlert('Eroare la încărcarea categoriilor', 'error');
        }
    }

    renderCategories() {
        const container = document.getElementById('categories-container');
        
        if (this.categories.length === 0) {
            container.innerHTML = '<p>Nu există categorii. Adaugă prima categorie!</p>';
            return;
        }

        const tableHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Imagine</th>
                        <th>Nume</th>
                        <th>Slug</th>
                        <th>Descriere</th>
                        <th>Acțiuni</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.categories.map(cat => `
                        <tr>
                            <td>
                                ${cat.image_url ? `<img src="${cat.image_url}" alt="${cat.name}">` : '📁'}
                            </td>
                            <td>${cat.name}</td>
                            <td>${cat.slug}</td>
                            <td>${cat.description ? cat.description.substring(0, 50) + '...' : '-'}</td>
                            <td class="actions">
                                <button class="btn btn-primary" onclick="adminPanel.editCategory('${cat.id}')">Editează</button>
                                <button class="btn btn-danger" onclick="adminPanel.deleteCategory('${cat.id}')">Șterge</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        container.innerHTML = tableHTML;
    }

    updateCategorySelect() {
        const select = document.getElementById('product-category');
        select.innerHTML = '<option value="">Fără categorie</option>';
        
        this.categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat.id;
            option.textContent = cat.name;
            select.appendChild(option);
        });
    }

    async handleCategorySubmit(e) {
        e.preventDefault();
        
        const categoryData = {
            name: document.getElementById('category-name').value,
            slug: this.createSlug(document.getElementById('category-name').value),
            description: document.getElementById('category-description').value,
            image_url: document.getElementById('category-image').value
        };

        try {
            if (this.currentCategoryId) {
                const { error } = await this.supabase
                    .from('categories')
                    .update(categoryData)
                    .eq('id', this.currentCategoryId);

                if (error) throw error;
                this.showAlert('Categorie actualizată cu succes!');
            } else {
                const { error } = await this.supabase
                    .from('categories')
                    .insert(categoryData);

                if (error) throw error;
                this.showAlert('Categorie adăugată cu succes!');
            }

            this.closeCategoryModal();
            await this.loadCategories();
        } catch (error) {
            console.error('Error saving category:', error);
            this.showAlert('Eroare la salvarea categoriei: ' + error.message, 'error');
        }
    }

    async editCategory(id) {
        const category = this.categories.find(c => c.id === id);
        if (!category) return;

        this.currentCategoryId = id;
        document.getElementById('category-modal-title').textContent = 'Editează Categorie';
        document.getElementById('category-id').value = id;
        document.getElementById('category-name').value = category.name;
        document.getElementById('category-description').value = category.description || '';
        document.getElementById('category-image').value = category.image_url || '';
        
        document.getElementById('category-modal').classList.add('active');
    }

    async deleteCategory(id) {
        if (!confirm('Ești sigur că vrei să ștergi această categorie?')) return;

        try {
            const { error } = await this.supabase
                .from('categories')
                .delete()
                .eq('id', id);

            if (error) throw error;

            this.showAlert('Categorie ștearsă cu succes!');
            await this.loadCategories();
        } catch (error) {
            console.error('Error deleting category:', error);
            this.showAlert('Eroare la ștergerea categoriei: ' + error.message, 'error');
        }
    }

    // ===== PRODUSE =====
    async loadProducts() {
        try {
            const { data, error } = await this.supabase
                .from('products')
                .select(`
                    *,
                    categories (
                        name
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            this.renderProducts(data || []);
        } catch (error) {
            console.error('Error loading products:', error);
            this.showAlert('Eroare la încărcarea produselor', 'error');
        }
    }

    renderProducts(products) {
        const container = document.getElementById('products-container');
        
        if (products.length === 0) {
            container.innerHTML = '<p>Nu există produse. Adaugă primul produs!</p>';
            return;
        }

        const tableHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Imagine</th>
                        <th>Nume</th>
                        <th>Categorie</th>
                        <th>Preț</th>
                        <th>Stoc</th>
                        <th>Status</th>
                        <th>Acțiuni</th>
                    </tr>
                </thead>
                <tbody>
                    ${products.map(product => {
                        const images = Array.isArray(product.images) ? product.images : [];
                        const firstImage = images.length > 0 ? images[0] : null;
                        const price = product.sale_price ? product.sale_price : product.price;
                        
                        return `
                            <tr>
                                <td>
                                    ${firstImage ? `<img src="${firstImage}" alt="${product.name}">` : '📦'}
                                </td>
                                <td><strong>${product.name}</strong><br><small>${product.sku || '-'}</small></td>
                                <td>${product.categories?.name || '-'}</td>
                                <td>
                                    ${product.sale_price ? `<s>${product.price} RON</s><br>` : ''}
                                    <strong>${price} RON</strong>
                                </td>
                                <td>${product.stock}</td>
                                <td>
                                    <span class="badge ${product.is_active ? 'badge-active' : 'badge-inactive'}">
                                        ${product.is_active ? 'Activ' : 'Inactiv'}
                                    </span>
                                    ${product.featured ? '<br><span class="badge badge-active">Recomandat</span>' : ''}
                                </td>
                                <td class="actions">
                                    <button class="btn btn-primary" onclick="adminPanel.editProduct('${product.id}')">Editează</button>
                                    <button class="btn btn-danger" onclick="adminPanel.deleteProduct('${product.id}')">Șterge</button>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;

        container.innerHTML = tableHTML;
    }

    async handleProductSubmit(e) {
        e.preventDefault();
        
        const imagesText = document.getElementById('product-images').value;
        const imagesArray = imagesText.split('\n').filter(url => url.trim()).map(url => url.trim());

        const productData = {
            name: document.getElementById('product-name').value,
            slug: this.createSlug(document.getElementById('product-name').value),
            description: document.getElementById('product-description').value,
            price: parseFloat(document.getElementById('product-price').value),
            sale_price: document.getElementById('product-sale-price').value ? 
                        parseFloat(document.getElementById('product-sale-price').value) : null,
            stock: parseInt(document.getElementById('product-stock').value),
            sku: document.getElementById('product-sku').value || null,
            category_id: document.getElementById('product-category').value || null,
            images: imagesArray,
            is_active: document.getElementById('product-active').checked,
            featured: document.getElementById('product-featured').checked
        };

        try {
            if (this.currentProductId) {
                const { error } = await this.supabase
                    .from('products')
                    .update(productData)
                    .eq('id', this.currentProductId);

                if (error) throw error;
                this.showAlert('Produs actualizat cu succes!');
            } else {
                const { error } = await this.supabase
                    .from('products')
                    .insert(productData);

                if (error) throw error;
                this.showAlert('Produs adăugat cu succes!');
            }

            this.closeProductModal();
            await this.loadProducts();
            await this.loadDashboard();
        } catch (error) {
            console.error('Error saving product:', error);
            this.showAlert('Eroare la salvarea produsului: ' + error.message, 'error');
        }
    }

    async editProduct(id) {
        try {
            const { data, error } = await this.supabase
                .from('products')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;

            const product = data;
            this.currentProductId = id;
            
            document.getElementById('product-modal-title').textContent = 'Editează Produs';
            document.getElementById('product-id').value = id;
            document.getElementById('product-name').value = product.name;
            document.getElementById('product-price').value = product.price;
            document.getElementById('product-sale-price').value = product.sale_price || '';
            document.getElementById('product-stock').value = product.stock;
            document.getElementById('product-sku').value = product.sku || '';
            document.getElementById('product-category').value = product.category_id || '';
            document.getElementById('product-description').value = product.description || '';
            
            const images = Array.isArray(product.images) ? product.images : [];
            document.getElementById('product-images').value = images.join('\n');
            
            document.getElementById('product-active').checked = product.is_active;
            document.getElementById('product-featured').checked = product.featured;
            
            document.getElementById('product-modal').classList.add('active');
        } catch (error) {
            console.error('Error loading product:', error);
            this.showAlert('Eroare la încărcarea produsului', 'error');
        }
    }

    async deleteProduct(id) {
        if (!confirm('Ești sigur că vrei să ștergi acest produs?')) return;

        try {
            const { error } = await this.supabase
                .from('products')
                .delete()
                .eq('id', id);

            if (error) throw error;

            this.showAlert('Produs șters cu succes!');
            await this.loadProducts();
            await this.loadDashboard();
        } catch (error) {
            console.error('Error deleting product:', error);
            this.showAlert('Eroare la ștergerea produsului: ' + error.message, 'error');
        }
    }

    // ===== COMENZI =====
    async loadOrders() {
        try {
            const { data, error } = await this.supabase
                .from('orders')
                .select(`
                    *,
                    order_items (
                        *
                    )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            this.renderOrders(data || []);
        } catch (error) {
            console.error('Error loading orders:', error);
            this.showAlert('Eroare la încărcarea comenzilor', 'error');
        }
    }

    renderOrders(orders) {
        const container = document.getElementById('orders-container');
        
        if (orders.length === 0) {
            container.innerHTML = '<p>Nu există comenzi încă.</p>';
            return;
        }

        const tableHTML = `
            <table>
                <thead>
                    <tr>
                        <th>Nr. Comandă</th>
                        <th>Client</th>
                        <th>Email</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Plată</th>
                        <th>Data</th>
                    </tr>
                </thead>
                <tbody>
                    ${orders.map(order => `
                        <tr>
                            <td><strong>${order.order_number}</strong></td>
                            <td>${order.customer_name}</td>
                            <td>${order.customer_email}</td>
                            <td><strong>${order.total_amount} RON</strong></td>
                            <td>${order.status}</td>
                            <td>${order.payment_status}</td>
                            <td>${new Date(order.created_at).toLocaleDateString('ro-RO')}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        container.innerHTML = tableHTML;
    }
}

// ===== FUNCȚII GLOBALE =====
function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(`${tabName}-tab`).classList.add('active');

    // Load data for tab
    if (tabName === 'products') {
        adminPanel.loadProducts();
    } else if (tabName === 'categories') {
        adminPanel.loadCategories();
    } else if (tabName === 'orders') {
        adminPanel.loadOrders();
    }
}

function openProductModal() {
    adminPanel.currentProductId = null;
    document.getElementById('product-modal-title').textContent = 'Adaugă Produs';
    document.getElementById('product-form').reset();
    document.getElementById('product-active').checked = true;
    document.getElementById('product-modal').classList.add('active');
}

function closeProductModal() {
    document.getElementById('product-modal').classList.remove('active');
}

function openCategoryModal() {
    adminPanel.currentCategoryId = null;
    document.getElementById('category-modal-title').textContent = 'Adaugă Categorie';
    document.getElementById('category-form').reset();
    document.getElementById('category-modal').classList.add('active');
}

function closeCategoryModal() {
    document.getElementById('category-modal').classList.remove('active');
}

// Inițializare
let adminPanel;
document.addEventListener('DOMContentLoaded', () => {
    adminPanel = new AdminPanel();
});