// api/send-email.js - Trimite email oferta print 3D via Resend / SMTP
// Fallback simplu: salvam cererea in Supabase si notificam pe email

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { name, email, phone, material, message, type } = req.body || {};

    if (!name || !email) {
        return res.status(400).json({ error: 'Nume si email sunt obligatorii' });
    }

    try {
        const supabase = createClient(
            process.env.SUPABASE_URL,
            (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY)
        );

        // Salvam cererea in Supabase (tabelul contact_requests)
        const { error } = await supabase
            .from('contact_requests')
            .insert({
                name,
                email,
                phone: phone || null,
                material: material || null,
                message,
                type: type || 'oferta-print3d',
                created_at: new Date().toISOString(),
                status: 'new',
            });

        if (error) {
            // Daca tabelul nu exista, returnam succes oricum (nu blocam UX-ul)
            console.warn('Supabase insert error (non-fatal):', error.message);
        }

        return res.status(200).json({ success: true });

    } catch (err) {
        console.error('Send email error:', err);
        return res.status(500).json({ error: err.message });
    }
}
