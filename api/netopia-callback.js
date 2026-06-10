// api/netopia-callback.js - IPN callback de la Netopia
// Actualizează statusul comenzii în Supabase după plată

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();

    try {
        const body = req.body;

        // Netopia v2 trimite JSON direct
        const orderID      = body?.order?.orderID || body?.orderID;
        const status       = body?.order?.status  || body?.status;
        const errorCode    = body?.order?.errorCode;
        const errorMessage = body?.order?.errorMessage;

        console.log(`📥 Netopia IPN: order=${orderID} status=${status} err=${errorCode}`);

        if (!orderID) {
            return res.status(400).send('<?xml version="1.0" encoding="utf-8"?><crc>Missing orderID</crc>');
        }

        // Mapare status Netopia → status intern
        // status=3 = confirmed/paid, status=5 = cancelled, status=6 = refunded
        let paymentStatus = 'pending';
        let orderStatus   = 'processing';

        if (status === 3) {
            paymentStatus = 'paid';
            orderStatus   = 'processing';
        } else if (status === 5 || errorCode) {
            paymentStatus = 'failed';
            orderStatus   = 'cancelled';
        }

        // Update Supabase
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        const { error } = await supabase
            .from('orders')
            .update({
                payment_status: paymentStatus,
                status: orderStatus,
                updated_at: new Date().toISOString(),
            })
            .eq('order_number', orderID);

        if (error) console.error('Supabase update error:', error);
        else console.log(`✅ Order ${orderID} updated: ${paymentStatus}`);

        // Răspuns obligatoriu pentru Netopia
        return res.status(200).send('<?xml version="1.0" encoding="utf-8"?><crc>confirmed</crc>');

    } catch (error) {
        console.error('❌ Callback error:', error);
        return res.status(200).send('<?xml version="1.0" encoding="utf-8"?><crc>error</crc>');
    }
}
