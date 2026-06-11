// api/admin-config.js - Config pentru panoul admin
// ATENȚIE: returnează serviceRoleKey - folosit doar din admin panel

export default function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    // Nu punem cache pentru admin config
    res.setHeader('Cache-Control', 'no-store');

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
    const supabaseServiceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY);

    if (!supabaseUrl || !supabaseServiceRoleKey) {
        return res.status(500).json({ 
            error: 'Config lipsă. Verifică SUPABASE_URL și SUPABASE_SERVICE_ROLE_KEY în Vercel.' 
        });
    }

    return res.status(200).json({
        supabaseUrl,
        supabaseAnonKey,
        supabaseServiceRoleKey,
    });
}
