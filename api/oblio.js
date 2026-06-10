// api/oblio.js - Vercel Serverless Function
// Oblio: scade stoc la plasarea comenzii

async function getOblioToken() {
    const res = await fetch('https://www.oblio.eu/api/authorize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            client_id: process.env.OBLIO_CLIENT_ID,
            client_secret: process.env.OBLIO_CLIENT_SECRET,
            grant_type: 'client_credentials'
        })
    });
    if (!res.ok) throw new Error('Oblio auth failed: ' + res.status);
    const d = await res.json();
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
        const cif = process.env.OBLIO_CIF;

        // POST /api/oblio?action=decrease-stock
        // body: { items: [{ name, code, quantity }] }
        if (action === 'decrease-stock') {
            const { items, orderNumber } = req.body;

            if (!items || !items.length) {
                return res.status(400).json({ error: 'items lipsesc' });
            }

            // Creare notă de ieșire stoc în Oblio
            const payload = {
                cif,
                seriesName: process.env.OBLIO_SERIES || 'STOC',
                issueDate: new Date().toISOString().split('T')[0],
                dueDate: new Date().toISOString().split('T')[0],
                reference: orderNumber || '',
                products: items.map(item => ({
                    name: item.name,
                    code: item.code || '',
                    measuringUnit: 'buc',
                    quantity: item.quantity,
                    price: item.price || 0,
                    vatName: 'Normala',
                    vatPercentage: 19,
                    vatIncluded: true,
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
