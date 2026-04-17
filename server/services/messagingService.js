const axios = require('axios');
require('dotenv').config();

// Vonage (Nexmo) — Free €2 trial credits on signup, no credit card needed
// Works on Indian numbers. Sign up: https://dashboard.nexmo.com/sign-up
const VONAGE_API_KEY    = process.env.VONAGE_API_KEY;
const VONAGE_API_SECRET = process.env.VONAGE_API_SECRET;

if (VONAGE_API_KEY && !VONAGE_API_KEY.includes('REPLACE')) {
    console.log('[Vonage] ✅ Credentials loaded. Direct SMS ready.');
} else {
    console.warn('[Vonage] ⚠️  API Key/Secret missing. Add to server/.env');
}

/**
 * Format phone to E.164 (91XXXXXXXXXX for Indian 10-digit numbers)
 */
function formatPhone(rawPhone) {
    let digits = rawPhone.replace(/\D/g, '');
    if (digits.length === 10) digits = '91' + digits;       // Indian 10-digit
    if (digits.startsWith('0') && digits.length === 11) digits = '91' + digits.slice(1);
    return digits;
}

/**
 * Send emergency SMS directly to donor's phone messaging box via Vonage
 */
exports.sendSmsAlert = async (donorPhone, donorName, bloodGroup, location, trackingId, recipientDetails, hospitalDetails) => {
    if (!VONAGE_API_KEY || VONAGE_API_KEY.includes('REPLACE')) {
        return { success: false, error: 'Vonage credentials missing. Add VONAGE_API_KEY and VONAGE_API_SECRET to server/.env' };
    }

    const to   = formatPhone(donorPhone);
    const hosp = hospitalDetails || { name: 'MKCG Medical College', address: 'Medical College Rd, Berhampur', phone: '0680-2292746' };
    const rec  = recipientDetails || {};

    const message =
`URGENT-BloodConnect: Dear ${donorName}, Blood Group ${bloodGroup} needed! ` +
`Patient: ${rec.name || 'Emergency'}, Ph: ${rec.phone || 'N/A'}. ` +
`Go to: ${hosp.name}, ${hosp.address}, Ph: ${hosp.phone}. ` +
`Ref: ${trackingId}. Please help!`;

    try {
        const response = await axios.post('https://rest.nexmo.com/sms/json', null, {
            params: {
                api_key:    VONAGE_API_KEY,
                api_secret: VONAGE_API_SECRET,
                from:       'BloodConnect',
                to:         to,
                text:       message,
                type:       'unicode'
            }
        });

        const result = response.data;
        const msg = result.messages && result.messages[0];

        if (msg && msg.status === '0') {
            console.log(`[Vonage ✅] SMS sent to +${to} | MsgID: ${msg['message-id']} | Cost: ${msg['message-price']} EUR`);
            return { success: true, sid: msg['message-id'], status: 'sent' };
        } else {
            const errText = msg ? msg['error-text'] : JSON.stringify(result);
            console.error('[Vonage ❌]', errText);
            return { success: false, error: errText };
        }
    } catch (err) {
        const errMsg = err.response ? JSON.stringify(err.response.data) : err.message;
        console.error('[Vonage ❌]', errMsg);
        return { success: false, error: errMsg };
    }
};

/**
 * Send confirmation SMS to donor
 */
exports.sendSmsConfirmation = async (donorPhone, hospitalDetails) => {
    if (!VONAGE_API_KEY || VONAGE_API_KEY.includes('REPLACE')) return { success: false };

    const to   = formatPhone(donorPhone);
    const hosp = hospitalDetails || { name: 'MKCG Medical College', address: 'Medical College Rd, Berhampur', phone: '0680-2292746' };

    const message =
`BloodConnect: Thank you! Please report to ${hosp.name}, ${hosp.address}. Ph: ${hosp.phone}. You are saving a life!`;

    try {
        const response = await axios.post('https://rest.nexmo.com/sms/json', null, {
            params: {
                api_key:    VONAGE_API_KEY,
                api_secret: VONAGE_API_SECRET,
                from:       'BloodConnect',
                to:         to,
                text:       message
            }
        });
        const msg = response.data.messages && response.data.messages[0];
        const ok  = msg && msg.status === '0';
        console.log(`[Vonage Confirmation ${ok ? '✅' : '❌'}] Sent to +${to}`);
        return { success: ok };
    } catch (err) {
        console.error('[Vonage Confirmation ❌]', err.message);
        return { success: false };
    }
};
