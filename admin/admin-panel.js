// Admin Panel - Full Featured
class AdminPanel {
    constructor() {
        this.supabase = supabase.createClient(
            SUPABASE_CONFIG.url,
            SUPABASE_CONFIG.serviceRoleKey
        );
        this.currentProductId = null;
        this.currentCategoryId = null;
        this.categories = [];
        this.allProducts = [];
        this.init();
    }

    async init() {
        await this.loadCategories();
        await this.loadDashboard();
        document.getElementById('product-form').addEventListener('submit', (e) => this.handleProductSubmit(e));
        document.getElementById('category-form').addEventListener('submit', (e) => this.handleCategorySubmit(e));
    }

    showAlert(message, type = 'success') {
        const alertContainer = document.getElementById('alert-container');
        alertContainer.innerHTML = `<div class="alert alert-${type === 'success' ? 'success' : 'error'}">${message}</div>`;
        setTimeout(() => { alertContainer.innerHTML = ''; }, 5000);
    }

    createSlug(text) {
        return text.toLowerCase()
            .replace(/ă/g,'a').replace(/â/g,'a').replace(/î/g,'i').replace(/ș/g,'s').replace(/ț/g,'t')
            .replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
    }

    // ═══ DASHBOARD ═══
    async loadDashboard() {
        try {
            const [pr, or, cr] = await Promise.all([
                this.supabase.from('products').select('*'),
                this.supabase.from('orders').select('*'),
                this.supabase.from('categories').select('*')
            ]);
            const products = pr.data || [], orders = or.data || [], cats = cr.data || [];
            const revenue = orders.reduce((s,o) => s + parseFloat(o.total_amount||0), 0);
            const pending = orders.filter(o => o.status === 'pending').length;
            const outOfStock = products.filter(p => p.stock === 0).length;

            document.getElementById('stats-container').innerHTML = `
                <div class="stat-card"><h3>Total Produse</h3><div class="stat-value">${products.length}</div></div>
                <div class="stat-card" style="background:linear-gradient(135deg,#f093fb,#f5576c)"><h3>Produse Active</h3><div class="stat-value">${products.filter(p=>p.is_active).length}</div></div>
                <div class="stat-card" style="background:linear-gradient(135deg,#4facfe,#00f2fe)"><h3>Categorii</h3><div class="stat-value">${cats.length}</div></div>
                <div class="stat-card" style="background:linear-gradient(135deg,#43e97b,#38f9d7)"><h3>Comenzi Total</h3><div class="stat-value">${orders.length}</div></div>
                <div class="stat-card" style="background:linear-gradient(135deg,#fa709a,#fee140)"><h3>Venit Total</h3><div class="stat-value">${revenue.toFixed(2)} RON</div></div>
                <div class="stat-card" style="background:linear-gradient(135deg,#ff9a00,#ff6200)"><h3>Comenzi Pending</h3><div class="stat-value">${pending}</div></div>
                <div class="stat-card" style="background:linear-gradient(135deg,#e74c3c,#c0392b)"><h3>Stoc Epuizat</h3><div class="stat-value">${outOfStock}</div></div>
            `;
        } catch(e) { this.showAlert('Eroare dashboard: '+e.message,'error'); }
    }

    // ═══ CATEGORII ═══
    async loadCategories() {
        const { data, error } = await this.supabase.from('categories').select('*').order('name');
        if (error) { this.showAlert('Eroare categorii: '+error.message,'error'); return; }
        this.categories = data || [];
        this.renderCategories();
        this.updateCategorySelect();
    }

    renderCategories() {
        const c = document.getElementById('categories-container');
        if (!this.categories.length) { c.innerHTML = '<p>Nu există categorii.</p>'; return; }
        c.innerHTML = `<table><thead><tr><th>Imagine</th><th>Nume</th><th>Slug</th><th>Descriere</th><th>Acțiuni</th></tr></thead><tbody>
            ${this.categories.map(cat => `<tr>
                <td>${cat.image_url ? `<img src="${cat.image_url}" style="width:40px;height:40px;object-fit:cover;border-radius:4px;">` : '📁'}</td>
                <td><strong>${cat.name}</strong></td><td><code>${cat.slug}</code></td>
                <td>${cat.description ? cat.description.substring(0,60)+'...' : '-'}</td>
                <td class="actions">
                    <button class="btn btn-primary" onclick="adminPanel.editCategory('${cat.id}')">✏️ Editează</button>
                    <button class="btn btn-danger" onclick="adminPanel.deleteCategory('${cat.id}')">🗑️ Șterge</button>
                </td>
            </tr>`).join('')}
        </tbody></table>`;
    }

    updateCategorySelect() {
        const sel = document.getElementById('product-category');
        sel.innerHTML = '<option value="">Fără categorie</option>';
        this.categories.forEach(c => {
            const o = document.createElement('option');
            o.value = c.id; o.textContent = c.name; sel.appendChild(o);
        });
    }

    async handleCategorySubmit(e) {
        e.preventDefault();
        const data = {
            name: document.getElementById('category-name').value,
            slug: this.createSlug(document.getElementById('category-name').value),
            description: document.getElementById('category-description').value,
            image_url: document.getElementById('category-image').value || null
        };
        try {
            if (this.currentCategoryId) {
                const { error } = await this.supabase.from('categories').update(data).eq('id', this.currentCategoryId);
                if (error) throw error;
                this.showAlert('Categorie actualizată!');
            } else {
                const { error } = await this.supabase.from('categories').insert(data);
                if (error) throw error;
                this.showAlert('Categorie adăugată!');
            }
            this.closeCategoryModal();
            await this.loadCategories();
        } catch(e) { this.showAlert('Eroare: '+e.message,'error'); }
    }

    async editCategory(id) {
        const cat = this.categories.find(c => c.id === id);
        if (!cat) return;
        this.currentCategoryId = id;
        document.getElementById('category-modal-title').textContent = 'Editează Categorie';
        document.getElementById('category-name').value = cat.name;
        document.getElementById('category-description').value = cat.description || '';
        document.getElementById('category-image').value = cat.image_url || '';
        document.getElementById('category-modal').classList.add('active');
    }

    async deleteCategory(id) {
        if (!confirm('Ștergi categoria? Produsele din ea rămân fără categorie.')) return;
        const { error } = await this.supabase.from('categories').delete().eq('id', id);
        if (error) { this.showAlert('Eroare: '+error.message,'error'); return; }
        this.showAlert('Categorie ștearsă!');
        await this.loadCategories();
    }

    // ═══ PRODUSE ═══
    async loadProducts() {
        try {
            const { data, error } = await this.supabase
                .from('products').select('*, categories(name)')
                .order('created_at', { ascending: false });
            if (error) throw error;
            this.allProducts = data || [];
            this.renderProducts(this.allProducts);
        } catch(e) { this.showAlert('Eroare produse: '+e.message,'error'); }
    }

    filterAdminProducts() {
        const search = document.getElementById('admin-search')?.value?.toLowerCase() || '';
        const cat = document.getElementById('admin-cat-filter')?.value || '';
        const stock = document.getElementById('admin-stock-filter')?.value || '';
        let filtered = [...this.allProducts];
        if (search) filtered = filtered.filter(p => p.name.toLowerCase().includes(search) || (p.sku||'').toLowerCase().includes(search));
        if (cat) filtered = filtered.filter(p => p.category_id === cat);
        if (stock === 'in') filtered = filtered.filter(p => p.stock > 0);
        if (stock === 'out') filtered = filtered.filter(p => p.stock === 0);
        if (stock === 'low') filtered = filtered.filter(p => p.stock > 0 && p.stock <= 10);
        document.getElementById('admin-results-count').textContent = filtered.length + ' produse';
        this.renderProducts(filtered);
    }

    renderProducts(products) {
        const c = document.getElementById('products-container');

        // Filter bar HTML
        const catOptions = this.categories.map(cat => `<option value="${cat.id}">${cat.name}</option>`).join('');
        const filterBar = `
            <div style="display:flex;gap:0.75rem;flex-wrap:wrap;align-items:center;margin-bottom:1rem;padding:1rem;background:var(--bg-card,#1a1a1a);border-radius:12px;border:1px solid var(--border,#333);">
                <input type="text" id="admin-search" placeholder="🔍 Caută produs/SKU..." oninput="adminPanel.filterAdminProducts()" style="flex:1;min-width:180px;padding:0.6rem 1rem;background:var(--bg-darker,#111);border:1px solid var(--border,#333);border-radius:8px;color:var(--text-primary,#fff);outline:none;">
                <select id="admin-cat-filter" onchange="adminPanel.filterAdminProducts()" style="padding:0.6rem;background:var(--bg-darker,#111);border:1px solid var(--border,#333);border-radius:8px;color:var(--text-primary,#fff);">
                    <option value="">Toate categoriile</option>${catOptions}
                </select>
                <select id="admin-stock-filter" onchange="adminPanel.filterAdminProducts()" style="padding:0.6rem;background:var(--bg-darker,#111);border:1px solid var(--border,#333);border-radius:8px;color:var(--text-primary,#fff);">
                    <option value="">Toate stocurile</option>
                    <option value="in">În stoc</option>
                    <option value="out">Stoc epuizat</option>
                    <option value="low">Stoc limitat (≤10)</option>
                </select>
                <span id="admin-results-count" style="color:#888;font-size:0.9rem;">${products.length} produse</span>
            </div>`;

        if (!products.length) { c.innerHTML = filterBar + '<p>Nu există produse.</p>'; return; }

        c.innerHTML = filterBar + `<div style="overflow-x:auto;"><table><thead><tr>
            <th>Imagine</th><th>Nume / SKU</th><th>Categorie</th><th>Preț</th>
            <th>Stoc</th><th>Status</th><th>Acțiuni</th>
        </tr></thead><tbody>
            ${products.map(p => {
                const img = Array.isArray(p.images) && p.images.length ? p.images[0] : null;
                const price = p.sale_price ? `<s style="color:#888">${p.price} RON</s><br><strong>${p.sale_price} RON</strong>` : `<strong>${p.price} RON</strong>`;
                const stockColor = p.stock === 0 ? '#e74c3c' : p.stock <= 10 ? '#ff9800' : '#27ae60';
                return `<tr>
                    <td>${img ? `<img src="${img}" style="width:50px;height:50px;object-fit:contain;border-radius:4px;background:#111;">` : '📦'}</td>
                    <td><strong>${p.name}</strong>${p.sku ? `<br><small style="color:#888">${p.sku}</small>` : ''}</td>
                    <td>${p.categories?.name || '-'}</td>
                    <td>${price}</td>
                    <td>
                        <div style="display:flex;align-items:center;gap:4px;">
                            <button onclick="adminPanel.changeStock('${p.id}', ${p.stock-1})" style="width:24px;height:24px;background:#333;border:none;color:#fff;border-radius:4px;cursor:pointer;font-size:0.9rem;">−</button>
                            <span style="color:${stockColor};font-weight:700;min-width:30px;text-align:center;">${p.stock}</span>
                            <button onclick="adminPanel.changeStock('${p.id}', ${p.stock+1})" style="width:24px;height:24px;background:#333;border:none;color:#fff;border-radius:4px;cursor:pointer;font-size:0.9rem;">+</button>
                        </div>
                    </td>
                    <td>
                        <span style="padding:2px 8px;border-radius:12px;font-size:0.8rem;background:${p.is_active?'#27ae60':'#e74c3c'};color:#fff;">${p.is_active?'Activ':'Inactiv'}</span>
                        ${p.featured ? '<br><span style="padding:2px 8px;border-radius:12px;font-size:0.8rem;background:#f97316;color:#fff;">⭐ Top</span>' : ''}
                    </td>
                    <td class="actions" style="white-space:nowrap;">
                        <button class="btn btn-primary" onclick="adminPanel.editProduct('${p.id}')">✏️</button>
                        <button class="btn btn-danger" onclick="adminPanel.deleteProduct('${p.id}')">🗑️</button>
                        <button class="btn" style="background:#555;" onclick="adminPanel.toggleActive('${p.id}', ${p.is_active})">${p.is_active?'⏸':'▶️'}</button>
                    </td>
                </tr>`;
            }).join('')}
        </tbody></table></div>`;
    }

    async changeStock(id, newStock) {
        if (newStock < 0) return;
        const { error } = await this.supabase.from('products').update({ stock: newStock }).eq('id', id);
        if (error) { this.showAlert('Eroare stoc: '+error.message,'error'); return; }
        const p = this.allProducts.find(p => p.id === id);
        if (p) p.stock = newStock;
        this.filterAdminProducts();
        await this.loadDashboard();
    }

    async toggleActive(id, current) {
        const { error } = await this.supabase.from('products').update({ is_active: !current }).eq('id', id);
        if (error) { this.showAlert('Eroare: '+error.message,'error'); return; }
        await this.loadProducts();
    }

    async handleProductSubmit(e) {
        e.preventDefault();
        const imagesText = document.getElementById('product-images').value;
        const images = imagesText.split('\n').map(u=>u.trim()).filter(Boolean);
        const variatii = document.getElementById('product-variatii')?.value?.trim();

        const data = {
            name: document.getElementById('product-name').value,
            slug: this.currentProductId 
                ? this.createSlug(document.getElementById('product-name').value) + '-' + Date.now().toString(36)
                : this.createSlug(document.getElementById('product-name').value),
            description: document.getElementById('product-description').value,
            price: parseFloat(document.getElementById('product-price').value),
            sale_price: document.getElementById('product-sale-price').value ? parseFloat(document.getElementById('product-sale-price').value) : null,
            stock: parseInt(document.getElementById('product-stock').value) || 0,
            sku: document.getElementById('product-sku').value || null,
            category_id: document.getElementById('product-category').value || null,
            images,
            is_active: document.getElementById('product-active').checked,
            featured: document.getElementById('product-featured').checked
        };
        if (this.currentProductId) data.slug = this.createSlug(data.name);

        try {
            if (this.currentProductId) {
                const { error } = await this.supabase.from('products').update(data).eq('id', this.currentProductId);
                if (error) throw error;
                this.showAlert('Produs actualizat!');
            } else {
                const { error } = await this.supabase.from('products').insert(data);
                if (error) throw error;
                this.showAlert('Produs adăugat!');
            }
            this.closeProductModal();
            await this.loadProducts();
            await this.loadDashboard();
        } catch(e) { this.showAlert('Eroare: '+e.message,'error'); }
    }

    async editProduct(id) {
        try {
            const { data, error } = await this.supabase.from('products').select('*').eq('id', id).single();
            if (error) throw error;
            this.currentProductId = id;
            document.getElementById('product-modal-title').textContent = 'Editează Produs';
            document.getElementById('product-name').value = data.name;
            document.getElementById('product-price').value = data.price;
            document.getElementById('product-sale-price').value = data.sale_price || '';
            document.getElementById('product-stock').value = data.stock;
            document.getElementById('product-sku').value = data.sku || '';
            document.getElementById('product-category').value = data.category_id || '';
            document.getElementById('product-description').value = data.description || '';
            document.getElementById('product-images').value = (Array.isArray(data.images) ? data.images : []).join('\n');
            document.getElementById('product-active').checked = data.is_active;
            document.getElementById('product-featured').checked = data.featured;
            if (document.getElementById('product-variatii')) {
                document.getElementById('product-variatii').value = '';
            }
            document.getElementById('product-modal').classList.add('active');
        } catch(e) { this.showAlert('Eroare: '+e.message,'error'); }
    }

    async deleteProduct(id) {
        if (!confirm('Ștergi produsul definitiv?')) return;
        const { error } = await this.supabase.from('products').delete().eq('id', id);
        if (error) { this.showAlert('Eroare: '+error.message,'error'); return; }
        this.showAlert('Produs șters!');
        await this.loadProducts();
        await this.loadDashboard();
    }

    // ═══ COMENZI ═══
    async loadOrders() {
        try {
            const { data, error } = await this.supabase
                .from('orders').select('*, order_items(*)')
                .order('created_at', { ascending: false });
            if (error) throw error;
            this.renderOrders(data || []);
        } catch(e) { this.showAlert('Eroare comenzi: '+e.message,'error'); }
    }

    renderOrders(orders) {
        const c = document.getElementById('orders-container');
        if (!orders.length) { c.innerHTML = '<p>Nu există comenzi.</p>'; return; }

        const statusColors = { pending:'#ff9800', processing:'#3498db', shipped:'#9b59b6', delivered:'#27ae60', cancelled:'#e74c3c' };

        c.innerHTML = `<div style="overflow-x:auto;"><table><thead><tr>
            <th>Nr. Comandă</th><th>Client</th><th>Contact</th><th>Produse</th>
            <th>Total</th><th>Status</th><th>Plată</th><th>Data</th><th>Acțiuni</th>
        </tr></thead><tbody>
            ${orders.map(o => {
                const items = o.order_items || [];
                const itemsStr = items.map(i => `${i.product_name||'Produs'} x${i.quantity}`).join(', ');
                const col = statusColors[o.status] || '#888';
                return `<tr>
                    <td><strong>${o.order_number}</strong></td>
                    <td>${o.customer_name||'-'}<br><small>${o.shipping_address?.city||''}</small></td>
                    <td><small>${o.customer_email||'-'}<br>${o.customer_phone||'-'}</small></td>
                    <td style="max-width:200px;"><small>${itemsStr||'-'}</small></td>
                    <td><strong>${o.total_amount} RON</strong></td>
                    <td>
                        <select onchange="adminPanel.updateOrderStatus('${o.id}', this.value)" style="padding:4px 8px;background:#222;border:1px solid #444;border-radius:6px;color:${col};font-weight:600;font-size:0.8rem;">
                            ${['pending','processing','shipped','delivered','cancelled'].map(s => 
                                `<option value="${s}" ${o.status===s?'selected':''} style="color:${statusColors[s]||'#fff'}">${s}</option>`
                            ).join('')}
                        </select>
                    </td>
                    <td>
                        <select onchange="adminPanel.updatePaymentStatus('${o.id}', this.value)" style="padding:4px 8px;background:#222;border:1px solid #444;border-radius:6px;color:#fff;font-size:0.8rem;">
                            ${['pending','paid','failed','refunded'].map(s => 
                                `<option value="${s}" ${o.payment_status===s?'selected':''}>${s}</option>`
                            ).join('')}
                        </select>
                    </td>
                    <td><small>${new Date(o.created_at).toLocaleDateString('ro-RO')}<br>${new Date(o.created_at).toLocaleTimeString('ro-RO',{hour:'2-digit',minute:'2-digit'})}</small></td>
                    <td>
                        <button class="btn btn-danger" onclick="adminPanel.deleteOrder('${o.id}')" style="font-size:0.75rem;padding:4px 8px;">🗑️</button>
                    </td>
                </tr>`;
            }).join('')}
        </tbody></table></div>`;
    }

    async updateOrderStatus(id, status) {
        const { error } = await this.supabase.from('orders').update({ status }).eq('id', id);
        if (error) this.showAlert('Eroare: '+error.message,'error');
        else this.showAlert('Status actualizat: '+status);
    }

    async updatePaymentStatus(id, payment_status) {
        const { error } = await this.supabase.from('orders').update({ payment_status }).eq('id', id);
        if (error) this.showAlert('Eroare: '+error.message,'error');
        else this.showAlert('Status plată: '+payment_status);
    }

    async deleteOrder(id) {
        if (!confirm('Ștergi comanda?')) return;
        await this.supabase.from('order_items').delete().eq('order_id', id);
        const { error } = await this.supabase.from('orders').delete().eq('id', id);
        if (error) { this.showAlert('Eroare: '+error.message,'error'); return; }
        this.showAlert('Comandă ștearsă!');
        await this.loadOrders();
        await this.loadDashboard();
    }
}

// ═══ FUNCȚII GLOBALE ═══
function switchTab(tabName) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.getElementById(`${tabName}-tab`).classList.add('active');
    if (tabName === 'products') adminPanel.loadProducts();
    else if (tabName === 'categories') adminPanel.loadCategories();
    else if (tabName === 'orders') adminPanel.loadOrders();
    else if (tabName === 'dashboard') adminPanel.loadDashboard();
}

function openProductModal() {
    adminPanel.currentProductId = null;
    document.getElementById('product-modal-title').textContent = 'Adaugă Produs Nou';
    document.getElementById('product-form').reset();
    document.getElementById('product-active').checked = true;
    document.getElementById('product-modal').classList.add('active');
}
function closeProductModal() { document.getElementById('product-modal').classList.remove('active'); adminPanel.currentProductId = null; }
function openCategoryModal() {
    adminPanel.currentCategoryId = null;
    document.getElementById('category-modal-title').textContent = 'Adaugă Categorie';
    document.getElementById('category-form').reset();
    document.getElementById('category-modal').classList.add('active');
}
function closeCategoryModal() { document.getElementById('category-modal').classList.remove('active'); adminPanel.currentCategoryId = null; }

let adminPanel;
document.addEventListener('DOMContentLoaded', () => { adminPanel = new AdminPanel(); });
