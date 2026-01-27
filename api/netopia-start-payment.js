// api/netopia-start-payment.js
// Vercel Serverless Function pentru inițiere plată Netopia

const crypto = require('crypto');

// ⚠️ IMPORTANT: Pune aceste valori în Vercel Environment Variables!
const NETOPIA_CONFIG = {
    signature: process.env.NETOPIA_SIGNATURE || '38QU-P3JY-21TG-M2ZF-C1YF',
    apiUrl: 'https://secure.netopia-payments.com',
    notifyUrl: '', // Va fi setat dinamic
    redirectUrl: '', // Va fi setat dinamic
};

// Funcție pentru generare token Netopia
function generateNeotopiaPaymentData(order) {
    const paymentData = {
        config: {
            emailTemplate: 'confirm',
            notifyUrl: NETOPIA_CONFIG.notifyUrl,
            redirectUrl: NETOPIA_CONFIG.redirectUrl,
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
            data: {
                property1: 'value1',
            },
        },
        order: {
            ntpID: null,
            posSignature: NETOPIA_CONFIG.signature,
            dateTime: new Date().toISOString(),
            description: order.description || 'Comanda TechLab',
            orderID: order.orderNumber,
            amount: parseFloat(order.total),
            currency: 'RON',
            billing: {
                email: order.customerEmail,
                phone: order.customerPhone,
                firstName: order.customerName.split(' ')[0] || '',
                lastName: order.customerName.split(' ').slice(1).join(' ') || '',
                city: order.city || 'Timișoara',
                country: 826, // România = 642, UK = 826 (cod ISO)
                state: order.county || 'Timiș',
                postalCode: order.postalCode || '300000',
                details: order.address || '',
            },
            shipping: {
                email: order.customerEmail,
                phone: order.customerPhone,
                firstName: order.customerName.split(' ')[0] || '',
                lastName: order.customerName.split(' ').slice(1).join(' ') || '',
                city: order.city || 'Timișoara',
                country: 826,
                state: order.county || 'Timiș',
                postalCode: order.postalCode || '300000',
                details: order.address || '',
            },
            products: order.items || [],
            installments: {
                selected: 1,
                available: [1],
            },
            data: {},
        },
    };

    return paymentData;
}

// Handler principal
export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const orderData = req.body;

        // Validare date
        if (!orderData.orderNumber || !orderData.total || !orderData.customerEmail) {
            return res.status(400).json({ 
                error: 'Date lipsă', 
                required: ['orderNumber', 'total', 'customerEmail'] 
            });
        }

        // Setare URLs dinamic
        const baseUrl = `https://${req.headers.host}`;
        NETOPIA_CONFIG.notifyUrl = `${baseUrl}/api/netopia-callback`;
        NETOPIA_CONFIG.redirectUrl = `${baseUrl}/payment-return.html?order=${orderData.orderNumber}`;

        // Generare payload Netopia
        const paymentData = generateNeotopiaPaymentData(orderData);

        // Convertire în Base64 pentru a trimite către Netopia
        const paymentDataBase64 = Buffer.from(JSON.stringify(paymentData)).toString('base64');

        // IMPORTANT: Aici ar trebui să criptăm cu cheia privată
        // Dar pentru simplitate inițială, trimitem base64

        // Apel către Netopia API
        const neotopiaResponse = await fetch(`${NETOPIA_CONFIG.apiUrl}/payment/card/start`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                env_key: paymentDataBase64,
                data: paymentDataBase64,
            }),
        });

        const neotopiaResult = await neotopiaResponse.json();

        if (neotopiaResult.error) {
            return res.status(400).json({ 
                error: 'Netopia error', 
                details: neotopiaResult 
            });
        }

        // Returnează URL-ul de plată către frontend
        return res.status(200).json({
            success: true,
            paymentUrl: neotopiaResult.paymentURL || `${NETOPIA_CONFIG.apiUrl}/payment/card?env_key=${neotopiaResult.env_key}`,
            token: neotopiaResult.env_key,
        });

    } catch (error) {
        console.error('Netopia payment error:', error);
        return res.status(500).json({ 
            error: 'Server error', 
            message: error.message 
        });
    }
}