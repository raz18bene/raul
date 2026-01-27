// api/netopia-callback.js
// Vercel Serverless Function - ESM version

export default async function handler(req, res) {
    console.log('📥 Netopia IPN received');

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { env_key } = req.body;

        if (!env_key) {
            console.error('❌ No env_key');
            return res.status(400).json({ error: 'No payment data' });
        }

        // Decode Base64
        const paymentDataJson = Buffer.from(env_key, 'base64').toString('utf-8');
        const paymentData = JSON.parse(paymentDataJson);

        console.log('📦 Payment data received:', paymentData);

        // TODO: Update order in Supabase
        // TODO: Send confirmation email

        return res.status(200).send('<?xml version="1.0" encoding="utf-8" ?><crc>Plata confirmata</crc>');

    } catch (error) {
        console.error('❌ Error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
}