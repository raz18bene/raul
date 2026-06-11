// api/oblio.js - Vercel Serverless Function
// Oblio: scade stoc la plasarea comenzii + sincronizare stoc din Oblio in Supabase

import { createClient } from '@supabase/supabase-js';

async function getOblioToken() {
    // Oblio OAuth2 - necesită form-urlencoded, nu JSON
    const body = new URLSearchParams({
        client_id: process.env.OBLIO_CLIENT_ID,
        client_secret: process.env.OBLIO_CLIENT_SECRET,
        grant_type: 'client_credentials',
    });

    const res = await fetch('https://www.oblio.eu/api/authorize/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error('Oblio auth failed: ' + res.status + ' ' + JSON.stringify(err));
    }
    const d = await res.json();
    if (!d.access_token) throw new Error('Oblio: no access_token in response: ' + JSON.stringify(d));
    return d.access_token;
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST' && req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

    const { action } = req.query;

    try {
        const token = await getOblioToken();
        const cif   = process.env.OBLIO_CIF;

        if (action === 'decrease-stock') {
            const { items, orderNumber } = req.body;
            if (!items || !items.length) return res.status(400).json({ error: 'items lipsesc' });

            const payload = {
                cif,
                seriesName: process.env.OBLIO_SERIES || 'STOC',
                issueDate: new Date().toISOString().split('T')[0],
                dueDate:   new Date().toISOString().split('T')[0],
                reference: orderNumber || '',
                products: items.map(item => ({
                    name:           item.name,
                    code:           item.code || '',
                    measuringUnit:  'buc',
                    quantity:       item.quantity,
                    price:          item.price || 0,
                    vatName:        'Normala',
                    vatPercentage:  19,
                    vatIncluded:    true,
                }))
            };

            const r = await fetch('https://www.oblio.eu/api/docs/notice', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            const d = await r.json();
            if (!r.ok) return res.status(400).json({ error: 'Oblio error', details: d });
            return res.status(200).json({ success: true, ...d });
        }

        // GET /api/oblio?action=sync-stock
        // Aduce stocurile din Oblio si le actualizeaza in Supabase
        // Matching: 1) dupa SKU daca exista, 2) fallback dupa nume normalizat (si completeaza SKU)
        if (action === 'sync-stock') {
            const r = await fetch(`https://www.oblio.eu/api/nomenclature/products?cif=${encodeURIComponent(cif)}&limitPerPage=250`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const d = await r.json();
            if (!r.ok || !d.data) return res.status(400).json({ error: 'Oblio error', details: d });

            const supabase = createClient(
                process.env.SUPABASE_URL,
                (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY)
            );

            const { data: products, error: prodErr } = await supabase
                .from('products')
                .select('id, sku, name, stock');

            if (prodErr) return res.status(500).json({ error: 'Supabase error', details: prodErr });

            const normalize = (s) => (s || '')
                .toLowerCase()
                .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // diacritice
                .replace(/[^a-z0-9]+/g, ' ')
                .trim();

            const updated = [];
            const notFound = [];
            const usedIds = new Set();

            for (const oblioProduct of d.data) {
                const code = (oblioProduct.code || '').trim();
                const oblioName = oblioProduct.name || '';

                // Calculeaza stocul total din toate gestiunile
                let totalStock = 0;
                if (Array.isArray(oblioProduct.stock)) {
                    totalStock = oblioProduct.stock.reduce((sum, s) => sum + (parseFloat(s.quantity) || 0), 0);
                } else {
                    continue; // produs fara info de stoc (ex: serviciu) - sarim
                }

                let match = null;
                let matchedBy = '';

                // 1. Match dupa SKU (daca exista cod in Oblio)
                if (code) {
                    match = products.find(p => !usedIds.has(p.id) && (p.sku || '').trim() === code);
                    if (match) matchedBy = 'sku';
                }

                // 2. Fallback: match dupa nume normalizat
                if (!match) {
                    const normOblio = normalize(oblioName);
                    match = products.find(p => !usedIds.has(p.id) && normalize(p.name) === normOblio);
                    if (match) matchedBy = 'nume';
                }

                if (!match) {
                    notFound.push({ code, name: oblioName, stock: totalStock });
                    continue;
                }

                usedIds.add(match.id);

                const updates = {};
                if (match.stock !== totalStock) updates.stock = totalStock;
                // Daca am gasit dupa nume si nu are SKU, completam SKU-ul din Oblio
                if (matchedBy === 'nume' && code && !(match.sku || '').trim()) updates.sku = code;

                if (Object.keys(updates).length > 0) {
                    const { error: updErr } = await supabase
                        .from('products')
                        .update(updates)
                        .eq('id', match.id);

                    if (!updErr) {
                        updated.push({
                            name: match.name,
                            matchedBy,
                            oldStock: match.stock,
                            newStock: totalStock,
                            skuSet: updates.sku || null,
                        });
                    }
                }
            }

            return res.status(200).json({
                success: true,
                updated_count: updated.length,
                updated,
                not_found_in_supabase: notFound,
                total_oblio_products: d.data.length,
            });
        }

        return res.status(400).json({ error: 'Action necunoscut. Foloseste: decrease-stock, sync-stock' });

    } catch (err) {
        console.error('Oblio error:', err);
        return res.status(500).json({ error: err.message });
    }
}
