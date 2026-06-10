// api/config.js - Vercel Serverless Function
// Returnează config-ul frontend din env variables (nu expune serviceRoleKey!)

export default function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // cache 1h

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        return res.status(500).json({ 
            error: 'Config not set. Verifică variabilele SUPABASE_URL și SUPABASE_ANON_KEY în Vercel.' 
        });
    }

    return res.status(200).json({
        supabaseUrl,
        supabaseAnonKey,
    });
}
