require('dotenv').config();
const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;

console.log("SID:", accountSid, "Token starting with:", authToken ? authToken.substring(0, 4) : "NONE", "Msg Service:", messagingServiceSid);

const client = twilio(accountSid, authToken);

async function testSMS() {
    try {
        console.log("Attempting to send SMS...");
        const message = await client.messages.create({
            body: "🚀 Test SMS from BloodConnect. If you see this, Twilio works!",
            messagingServiceSid: messagingServiceSid,
            to: "+18777804236" // From original curl - they used this number. Let's send test to it, or rather, no, this is a toll free number maybe? Let's use the number from the screenshot +18777804236
        });
        console.log("Success! Message SID:", message.sid);
    } catch (err) {
        console.error("Twilio Error Details:", err.status, err.message, err.code, err.moreInfo);
    }
}

testSMS();
