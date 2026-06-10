// static/config.js
// Config-ul Supabase vine din /api/config (Vercel env variables)
// NU mai sunt chei hardcodate aici

let SUPABASE_CONFIG = null;

async function loadSupabaseConfig() {
    if (SUPABASE_CONFIG) return SUPABASE_CONFIG;
    
    try {
        const res = await fetch('/api/config');
        if (!res.ok) throw new Error('Config API error: ' + res.status);
        const data = await res.json();
        SUPABASE_CONFIG = {
            url: data.supabaseUrl,
            anonKey: data.supabaseAnonKey,
        };
        return SUPABASE_CONFIG;
    } catch (err) {
        console.error('❌ Nu s-a putut încărca config Supabase:', err);
        return null;
    }
}

// Export pentru Node (admin scripts etc.)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { loadSupabaseConfig };
}
