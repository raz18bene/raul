// api/sameday.js - Vercel Serverless Function
// Handles: auth token, AWB generation, AWB status

const SAMEDAY_API = 'https://api.sameday.ro';

async function getToken() {
    const res = await fetch(`${SAMEDAY_API}/api/authenticate`, {
        method: 'POST',
        headers: {
            'X-AUTH-USERNAME': process.env.SAMEDAY_USERNAME,
            'X-AUTH-PASSWORD': process.env.SAMEDAY_PASSWORD,
            'Content-Type': 'application/json',
        }
    });
    if (!res.ok) throw new Error('SameDay auth failed: ' + res.status);
    const data = await res.json();
    return data.token;
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    const { action } = req.query;

    try {
        const token = await getToken();

        // GET /api/sameday?action=services
        if (action === 'services') {
            const r = await fetch(`${SAMEDAY_API}/api/client/services?countPerPage=100`, {
                headers: { 'X-AUTH-TOKEN': token }
            });
            const d = await r.json();
            return res.status(200).json(d);
        }

        // POST /api/sameday?action=create-awb
        if (action === 'create-awb' && req.method === 'POST') {
            const {
                recipientName, recipientPhone, recipientEmail,
                recipientAddress, recipientCity, recipientCounty, recipientPostalCode,
                weight, parcels, cashOnDelivery, orderValue, insuredValue,
                observation, orderNumber
            } = req.body;

            const pickupPoint = process.env.SAMEDAY_PICKUP_POINT;
            const serviceId  = process.env.SAMEDAY_SERVICE_ID;

            const payload = {
                pickupPoint: parseInt(pickupPoint),
                packageType: 1, // colet
                packageNumber: parcels || 1,
                packageWeight: weight || 1,
                service: parseInt(serviceId),
                awbPayment: 1, // platit de expeditor
                cashOnDelivery: cashOnDelivery || 0,
                insuredValue: insuredValue || 0,
                thirdPartyPickup: 0,
                observation: observation || `Comanda ${orderNumber}`,
                clientInternalReference: orderNumber || '',
                recipient: {
                    name: recipientName,
                    phoneNumber: recipientPhone,
                    address: recipientAddress,
                    locality: { name: recipientCity },
                    county:  { name: recipientCounty },
                    postalCode: recipientPostalCode || '',
                    email: recipientEmail || '',
                    personType: 0, // persoana fizica
                },
                parcels: Array.from({ length: parcels || 1 }, () => ({
                    weight: weight || 1,
                    width: 20,
                    length: 30,
                    height: 10,
                }))
            };

            const r = await fetch(`${SAMEDAY_API}/api/awb`, {
                method: 'POST',
                headers: {
                    'X-AUTH-TOKEN': token,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            const d = await r.json();
            if (!r.ok) return res.status(400).json({ error: 'SameDay error', details: d });
            return res.status(200).json({ success: true, awbNumber: d.awbNumber, ...d });
        }

        // GET /api/sameday?action=track&awb=XXXXXXX
        if (action === 'track') {
            const { awb } = req.query;
            const r = await fetch(`${SAMEDAY_API}/api/awb/${awb}/status`, {
                headers: { 'X-AUTH-TOKEN': token }
            });
            const d = await r.json();
            return res.status(200).json(d);
        }

        return res.status(400).json({ error: 'Action necunoscut. Foloseste: services, create-awb, track' });

    } catch (err) {
        console.error('SameDay error:', err);
        return res.status(500).json({ error: err.message });
    }
}
