// api/admin-auth.js - Autentificare admin prin Vercel env
// Credentialele sunt DOAR în Vercel, nu în cod

export default function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { username, password } = req.body || {};

    const correctUser = process.env.ADMIN_USERNAME;
    const correctPass = process.env.ADMIN_PASSWORD;

    if (!correctUser || !correctPass) {
        return res.status(500).json({ error: 'Admin credentials not configured in Vercel env' });
    }

    if (username === correctUser && password === correctPass) {
        // Generăm un token simplu bazat pe timestamp + secret
        const secret = process.env.ADMIN_SECRET || 'fallback-secret';
        const token = Buffer.from(`${username}:${Date.now()}:${secret}`).toString('base64');
        return res.status(200).json({ success: true, token });
    }

    return res.status(401).json({ success: false, error: 'Credentiale incorecte' });
}
