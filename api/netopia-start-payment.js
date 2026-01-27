// api/netopia-start-payment.js
// Vercel Serverless Function - ESM version

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        console.log('📥 Payment request received');
        
        const orderData = req.body;

        // Validare
        if (!orderData || !orderData.orderNumber || !orderData.total || !orderData.customerEmail) {
            console.error('❌ Validation failed');
            return res.status(400).json({ 
                error: 'Date lipsă',
                required: ['orderNumber', 'total', 'customerEmail']
            });
        }

        console.log('✅ Validation passed for order:', orderData.orderNumber);

        // Verifică NETOPIA_SIGNATURE
        const signature = process.env.NETOPIA_SIGNATURE;
        if (!signature) {
            console.error('❌ NETOPIA_SIGNATURE not set');
            return res.status(500).json({ 
                error: 'Server configuration error'
            });
        }

        console.log('🔑 Signature configured');

        // URLs
        const baseUrl = `https://${req.headers.host}`;
        const notifyUrl = `${baseUrl}/api/netopia-callback`;
        const redirectUrl = `${baseUrl}/payment-return.html?order=${orderData.orderNumber}`;

        console.log('🌐 URLs configured');

        // Payment data
        const paymentData = {
            config: {
                emailTemplate: 'confirm',
                notifyUrl: notifyUrl,
                redirectUrl: redirectUrl,
                language: 'ro',
            },
            payment: {
                options: {
                    installments: 1,
                    bonus: 0,
                },
                instrument: {
                    type: 'card',
                    account: '',
                    expMonth: '',
                    expYear: '',
                    secretCode: '',
                    token: '',
                },
            },
            order: {
                ntpID: null,
                posSignature: signature,
                dateTime: new Date().toISOString(),
                description: orderData.description || 'Comanda TechLab',
                orderID: orderData.orderNumber,
                amount: parseFloat(orderData.total),
                currency: 'RON',
                billing: {
                    email: orderData.customerEmail,
                    phone: orderData.customerPhone || '',
                    firstName: orderData.customerName?.split(' ')[0] || '',
                    lastName: orderData.customerName?.split(' ').slice(1).join(' ') || '',
                    city: orderData.city || 'Timișoara',
                    country: 642, // România
                    state: orderData.county || 'Timiș',
                    postalCode: orderData.postalCode || '300000',
                    details: orderData.address || '',
                },
                shipping: {
                    email: orderData.customerEmail,
                    phone: orderData.customerPhone || '',
                    firstName: orderData.customerName?.split(' ')[0] || '',
                    lastName: orderData.customerName?.split(' ').slice(1).join(' ') || '',
                    city: orderData.city || 'Timișoara',
                    country: 642,
                    state: orderData.county || 'Timiș',
                    postalCode: orderData.postalCode || '300000',
                    details: orderData.address || '',
                },
                products: orderData.items || [],
                installments: {
                    selected: 1,
                    available: [1],
                },
            },
        };

        console.log('📦 Payment data prepared');

        // TEMPORAR: Return test URL
        // În producție aici ar fi apel real către Netopia
        const testPaymentUrl = 'https://secure.netopia-payments.com/payment/card_test';

        console.log('✅ Returning payment URL');

        return res.status(200).json({
            success: true,
            paymentUrl: testPaymentUrl,
            message: 'Payment initialized (TEST MODE)',
            orderNumber: orderData.orderNumber,
            amount: paymentData.order.amount,
        });

    } catch (error) {
        console.error('❌ Fatal error:', error);
        return res.status(500).json({ 
            error: 'Server error',
            message: error.message
        });
    }
}