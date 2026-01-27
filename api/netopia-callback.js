// api/netopia-callback.js
// Vercel Serverless Function pentru primire notificare de la Netopia (IPN)

const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

// Configurare Supabase
const supabase = createClient(
    process.env.SUPABASE_URL || 'https://iztqphtcltvprxcbdmzd.supabase.co',
    process.env.SUPABASE_SERVICE_KEY || 'YOUR_SERVICE_ROLE_KEY'
);

// Netopia signature pentru validare
const NETOPIA_SIGNATURE = process.env.NETOPIA_SIGNATURE || '38QU-P3JY-21TG-M2ZF-C1YF';

// Handler pentru IPN (Instant Payment Notification)
export default async function handler(req, res) {
    console.log('📥 Netopia IPN received:', req.method);

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Netopia trimite datele în body ca env_key
        const { env_key } = req.body;

        if (!env_key) {
            console.error('❌ No env_key in request');
            return res.status(400).json({ error: 'No payment data received' });
        }

        // Decodare Base64
        const paymentDataJson = Buffer.from(env_key, 'base64').toString('utf-8');
        const paymentData = JSON.parse(paymentDataJson);

        console.log('📦 Payment data:', paymentData);

        // Validare signature
        if (paymentData.order?.posSignature !== NETOPIA_SIGNATURE) {
            console.error('❌ Invalid signature');
            return res.status(403).json({ error: 'Invalid signature' });
        }

        // Extrage informații despre plată
        const {
            orderID,
            amount,
            currency,
            status, // ex: 'paid', 'pending', 'error'
            errorCode,
            errorMessage,
        } = paymentData.payment || {};

        const ntpID = paymentData.ntpID; // Transaction ID de la Netopia

        console.log(`💳 Payment status: ${status} for order ${orderID}`);

        // Actualizare status comandă în Supabase
        if (status === 'paid' || status === '3') { // 3 = confirmat
            // Marchează comanda ca plătită
            const { data, error } = await supabase
                .from('orders')
                .update({
                    payment_status: 'paid',
                    payment_method: 'card',
                    payment_transaction_id: ntpID,
                    updated_at: new Date().toISOString(),
                })
                .eq('order_number', orderID);

            if (error) {
                console.error('❌ Supabase error:', error);
                return res.status(500).json({ error: 'Database error' });
            }

            console.log('✅ Order marked as paid:', orderID);

            // TODO: Trimite email de confirmare

            return res.status(200).send('<?xml version="1.0" encoding="utf-8" ?><crc>Plata confirmata</crc>');
        } else {
            // Plata eșuată sau în așteptare
            await supabase
                .from('orders')
                .update({
                    payment_status: status === 'pending' ? 'pending' : 'failed',
                    payment_error: errorMessage || `Error code: ${errorCode}`,
                    updated_at: new Date().toISOString(),
                })
                .eq('order_number', orderID);

            console.log(`⚠️ Payment ${status} for order ${orderID}`);

            return res.status(200).send('<?xml version="1.0" encoding="utf-8" ?><crc>Eroare de plata</crc>');
        }

    } catch (error) {
        console.error('❌ IPN processing error:', error);
        return res.status(500).json({ error: 'Server error', message: error.message });
    }
}