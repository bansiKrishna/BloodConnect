const db = require('../database/db');
const messagingService = require('../services/messagingService');

// Webhook endpoint to intercept Twilio 2-way SMS replies
exports.handleSmsReply = async (req, res) => {
    // Twilio sends payload as application/x-www-form-urlencoded
    const { Body, From } = req.body;
    
    if (!Body || !From) {
        return res.status(400).send("Missing Payload Parameters");
    }

    // In SMS, From is typically +<country_code><number>
    const donorPhone = From.replace('+', '');
    const message = Body.trim().toLowerCase();
    
    console.log(`[Twilio Webhook] Received from ${donorPhone}: '${message}'`);

    let responseValue = "";
    if (message === "1" || message.includes("yes")) {
        responseValue = "YES";
    } else if (message === "2" || message.includes("no")) {
        responseValue = "NO";
    } else {
        console.log("Unrecognized command from donor.");
        return res.status(200).send('<Response></Response>'); // Acknowledge Twilio safely
    }

    // Since a donor replies YES, we log it and notify them of the hospital
    // We update the DB first
    const insertSQL = `INSERT INTO donor_responses (donor_phone, tracking_id, response) VALUES (?, ?, ?)`;
    db.run(insertSQL, [donorPhone, "UNKNOWN_TRACKING", responseValue], async (err) => {
        if (err) {
            console.error("Database error tracking donor response:", err);
            return res.status(500).send("DB Error");
        }
        
        console.log(`Marked donor ${donorPhone} as ${responseValue}`);

        if (responseValue === "YES") {
            // Ideally map tracking_id to hospital details. For demo, we send generic hospital info
            const hospitalDetails = {
                name: "MKCG Medical College & Hospital",
                address: "Medical College Rd, Berhampur",
                phone: "0680-2292746"
            };
            
            // Dispatch confirmation!
            await messagingService.sendSmsConfirmation(donorPhone, hospitalDetails);
        }

        // Must return Twilio native XML response to acknowledge receipt
        res.set('Content-Type', 'text/xml');
        res.status(200).send('<Response></Response>');
    });
};

// Polling Helper Endpoint - Allows Admin UI to check if the specific donor accepted
exports.checkDonorStatus = (req, res) => {
    let { phone } = req.query;
    if(!phone) return res.json({ status: "pending" });
    
    // Normalize phone identically
    let strippedPhone = phone.replace(/\D/g, "");
    if (!strippedPhone.startsWith("91")) strippedPhone = "91" + strippedPhone;
    
    // Only fetch responses that occurred within the last 30 minutes!
    const sql = `SELECT response FROM donor_responses WHERE donor_phone LIKE ? AND timestamp >= datetime('now', '-30 minutes') ORDER BY timestamp DESC LIMIT 1`;
    db.get(sql, [`%${strippedPhone}%`], (err, row) => {
        if (err || !row) {
            return res.json({ status: "pending" });
        }
        return res.json({ status: row.response }); 
    });
};
