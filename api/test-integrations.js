// api/test-integrations.js - Test rapid Oblio + SameDay
// Accesat doar din admin, șterge acest fișier după ce confirmi că merge

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    const results = {};

    // Test SameDay auth
    try {
        const r = await fetch('https://api.sameday.ro/api/authenticate', {
            method: 'POST',
            headers: {
                'X-AUTH-USERNAME': process.env.SAMEDAY_USERNAME,
                'X-AUTH-PASSWORD': process.env.SAMEDAY_PASSWORD,
                'Content-Type': 'application/json',
            }
        });
        const d = await r.json();
        results.sameday = r.ok
            ? { ok: true, message: 'Autentificare reușită ✅', token_preview: d.token?.slice(0,10) + '...' }
            : { ok: false, message: 'Autentificare eșuată ❌', details: d };
    } catch(e) {
        results.sameday = { ok: false, message: 'Eroare conexiune ❌', details: e.message };
    }

    // Test Oblio auth
    try {
        const r = await fetch('https://www.oblio.eu/api/authorize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: process.env.OBLIO_CLIENT_ID,
                client_secret: process.env.OBLIO_CLIENT_SECRET,
                grant_type: 'client_credentials'
            })
        });
        const d = await r.json();
        results.oblio = r.ok
            ? { ok: true, message: 'Autentificare reușită ✅', token_preview: d.access_token?.slice(0,10) + '...' }
            : { ok: false, message: 'Autentificare eșuată ❌', details: d };
    } catch(e) {
        results.oblio = { ok: false, message: 'Eroare conexiune ❌', details: e.message };
    }

    return res.status(200).json(results);
}
