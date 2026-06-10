// api/oblio.js - Vercel Serverless Function
// Oblio: scade stoc la plasarea comenzii

async function getOblioToken() {
    // Oblio OAuth2 - necesită form-urlencoded, nu JSON
    const body = new URLSearchParams({
        client_id: process.env.OBLIO_CLIENT_ID,
        client_secret: process.env.OBLIO_CLIENT_SECRET,
        grant_type: 'client_credentials',
    });

    const res = await fetch('https://www.oblio.eu/api/authorize', {
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
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

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

        return res.status(400).json({ error: 'Action necunoscut. Foloseste: decrease-stock' });

    } catch (err) {
        console.error('Oblio error:', err);
        return res.status(500).json({ error: err.message });
    }
}
