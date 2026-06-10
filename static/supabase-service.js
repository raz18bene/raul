// Serviciu Supabase pentru baza de date - pentru folderul static/supabase-service.js
class SupabaseService {
    constructor(config) {
        this.supabaseUrl = config.url;
        this.supabaseKey = config.anonKey;
        this.client = supabase.createClient(this.supabaseUrl, this.supabaseKey);
    }

    // ===== CATEGORII =====
    async getCategories() {
        const { data, error } = await this.client
            .from('categories')
            .select('*')
            .order('name', { ascending: true });
        
        if (error) throw error;
        return data;
    }

    async getCategoryBySlug(slug) {
        const { data, error } = await this.client
            .from('categories')
            .select('*')
            .eq('slug', slug)
            .single();
        
        if (error) throw error;
        return data;
    }

    // ===== PRODUSE =====
    async getProducts(filters = {}) {
        let query = this.client
            .from('products')
            .select(`
                *,
                categories (
                    id,
                    name,
                    slug
                )
            `)
            .eq('is_active', true);

        if (filters.categoryId) {
            query = query.eq('category_id', filters.categoryId);
        }

        if (filters.featured) {
            query = query.eq('featured', true);
        }

        if (filters.search) {
            query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
        }

        query = query.order('created_at', { ascending: false });

        const { data, error } = await query;
        
        if (error) throw error;
        return data;
    }

    async getProductBySlug(slug) {
        const { data, error } = await this.client
            .from('products')
            .select(`
                *,
                categories (
                    id,
                    name,
                    slug
                )
            `)
            .eq('slug', slug)
            .eq('is_active', true)
            .single();
        
        if (error) throw error;
        return data;
    }

    async getProductById(id) {
        const { data, error } = await this.client
            .from('products')
            .select(`
                *,
                categories (
                    id,
                    name,
                    slug
                )
            `)
            .eq('id', id)
            .single();
        
        if (error) throw error;
        return data;
    }

    // ===== COMENZI =====
    async createOrder(orderData) {
        const { data, error } = await this.client
            .from('orders')
            .insert(orderData)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }

    async createOrderItems(items) {
        const { data, error } = await this.client
            .from('order_items')
            .insert(items)
            .select();
        
        if (error) throw error;
        return data;
    }

    async updateOrderStatus(orderId, status, paymentStatus = null) {
        const updateData = { status };
        if (paymentStatus) {
            updateData.payment_status = paymentStatus;
        }

        const { data, error } = await this.client
            .from('orders')
            .update(updateData)
            .eq('id', orderId)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }

    async getOrderByNumber(orderNumber) {
        const { data, error } = await this.client
            .from('orders')
            .select(`
                *,
                order_items (
                    *,
                    products (
                        name,
                        images
                    )
                )
            `)
            .eq('order_number', orderNumber)
            .single();
        
        if (error) throw error;
        return data;
    }

    // ===== STOC =====
    async updateProductStock(productId, quantity) {
        // Obține stocul curent
        const { data: product, error: fetchError } = await this.client
            .from('products')
            .select('stock')
            .eq('id', productId)
            .single();

        if (fetchError) throw fetchError;

        // Actualizează stocul
        const newStock = product.stock - quantity;
        
        const { data, error } = await this.client
            .from('products')
            .update({ stock: newStock })
            .eq('id', productId)
            .select()
            .single();
        
        if (error) throw error;
        return data;
    }
}

// Inițializare serviciu (async - config vine din /api/config)
let supabaseService = null;

async function initSupabaseService() {
    if (supabaseService) return supabaseService;
    const config = await loadSupabaseConfig();
    if (config) {
        supabaseService = new SupabaseService(config);
    }
    return supabaseService;
}

// Auto-init la încărcare - stochează promise-ul ca să nu se apeleze de 2 ori
let _initPromise = null;
function ensureSupabaseService() {
    if (!_initPromise) {
        _initPromise = initSupabaseService();
    }
    return _initPromise;
}

// Pornește init imediat
ensureSupabaseService();