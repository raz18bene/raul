// api/send-email.js
// Salvează cererea în Supabase + trimite email via Resend

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).end();

    const { name, email, phone, material, message, type, fileUrl } = req.body || {};
    if (!name || !email) return res.status(400).json({ error: 'Nume și email obligatorii' });

    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
    const supabase = createClient(process.env.SUPABASE_URL, supabaseKey);

    // 1. Salvează în Supabase
    await supabase.from('contact_requests').insert({
        name, email,
        phone: phone || null,
        material: material || null,
        message: message || null,
        type: type || 'oferta-print3d',
        file_url: fileUrl || null,
        status: 'new',
        created_at: new Date().toISOString(),
    }).then(({ error }) => {
        if (error) console.warn('Supabase insert warn:', error.message);
    });

    // 2. Trimite email via Resend (dacă e configurat)
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
        try {
            await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${resendKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    from: 'TechNest <noreply@technest.ro>',
                    to: ['technest.prototyping@gmail.com'],
                    reply_to: email,
                    subject: `Cerere ofertă Print 3D — ${name}`,
                    html: `
                        <h2>Cerere nouă Print 3D</h2>
                        <table>
                            <tr><td><b>Nume:</b></td><td>${name}</td></tr>
                            <tr><td><b>Email:</b></td><td>${email}</td></tr>
                            <tr><td><b>Telefon:</b></td><td>${phone || '-'}</td></tr>
                            <tr><td><b>Material:</b></td><td>${material || '-'}</td></tr>
                            <tr><td><b>Detalii:</b></td><td>${message || '-'}</td></tr>
                            ${fileUrl ? `<tr><td><b>Fișier:</b></td><td><a href="${fileUrl}">Descarcă fișierul 3D</a></td></tr>` : ''}
                        </table>
                    `,
                }),
            });
        } catch (e) {
            console.warn('Resend warn:', e.message);
        }
    }

    return res.status(200).json({ success: true });
}
