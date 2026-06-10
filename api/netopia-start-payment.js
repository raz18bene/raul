// api/netopia-start-payment.js - Vercel Serverless Function
// Toate credentialele vin din Vercel env variables - NIMIC hardcodat

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    try {
        const orderData = req.body;

        // Validare date obligatorii
        if (!orderData?.orderNumber || !orderData?.total || !orderData?.customerEmail) {
            return res.status(400).json({
                error: 'Date lipsă',
                required: ['orderNumber', 'total', 'customerEmail']
            });
        }

        // Credentiale din Vercel env - NIMIC hardcodat
        const signature  = process.env.NETOPIA_SIGNATURE;
        const publicKey  = process.env.NETOPIA_PUBLIC_KEY;
        const privateKey = process.env.NETOPIA_PRIVATE_KEY;

        if (!signature || !publicKey || !privateKey) {
            console.error('❌ Netopia env vars lipsesc');
            return res.status(500).json({ error: 'Netopia not configured' });
        }

        const baseUrl    = `https://${req.headers.host}`;
        const notifyUrl  = `${baseUrl}/api/netopia-callback`;
        const redirectUrl = `${baseUrl}/payment-return.html?order=${orderData.orderNumber}`;

        // Construiește payload Netopia v2
        const payload = {
            config: {
                emailTemplate: 'confirm',
                notifyUrl,
                redirectUrl,
                language: 'ro',
            },
            payment: {
                options: { installments: 1, bonus: 0 },
                instrument: {
                    type: 'card',
                    account: '', expMonth: '', expYear: '',
                    secretCode: '', token: '',
                },
            },
            order: {
                ntpID: null,
                posSignature: signature,
                dateTime: new Date().toISOString(),
                description: `Comanda ${orderData.orderNumber} - TechNest`,
                orderID: orderData.orderNumber,
                amount: parseFloat(orderData.total),
                currency: 'RON',
                billing: {
                    email: orderData.customerEmail,
                    phone: orderData.customerPhone || '',
                    firstName: orderData.customerName?.split(' ')[0] || '',
                    lastName: orderData.customerName?.split(' ').slice(1).join(' ') || '',
                    city: orderData.city || '',
                    country: 642,
                    state: orderData.county || '',
                    postalCode: orderData.postalCode || '',
                    details: orderData.address || '',
                },
                shipping: {
                    email: orderData.customerEmail,
                    phone: orderData.customerPhone || '',
                    firstName: orderData.customerName?.split(' ')[0] || '',
                    lastName: orderData.customerName?.split(' ').slice(1).join(' ') || '',
                    city: orderData.city || '',
                    country: 642,
                    state: orderData.county || '',
                    postalCode: orderData.postalCode || '',
                    details: orderData.address || '',
                },
                products: orderData.items || [],
                installments: { selected: 1, available: [1] },
            },
        };

        // Apel real Netopia v2 API
        const netopiaRes = await fetch('https://secure.netopia-payments.com/payment/card/start', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': publicKey,
            },
            body: JSON.stringify(payload),
        });

        const netopiaData = await netopiaRes.json();

        if (!netopiaRes.ok || !netopiaData?.payment?.paymentURL) {
            console.error('❌ Netopia error:', netopiaData);
            return res.status(502).json({
                error: 'Netopia payment init failed',
                details: netopiaData
            });
        }

        return res.status(200).json({
            success: true,
            paymentUrl: netopiaData.payment.paymentURL,
            orderNumber: orderData.orderNumber,
            amount: payload.order.amount,
        });

    } catch (error) {
        console.error('❌ Fatal error:', error);
        return res.status(500).json({ error: 'Server error', message: error.message });
    }
}
