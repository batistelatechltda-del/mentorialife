const twilio = require('twilio');
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);


const sendSMS = async (to, body) => {
    try {
        const msg = await client.messages.create({
            body,
            messagingServiceSid: process.env.TWILIO_SERVICE_SID,
            to,
        });
        console.log(`📲 SMS sent to ${to}: ${msg.sid}`);
    } catch (error) {
        console.error(`❌ Failed to send SMS to ${to}:`, error.message);
    }
};

module.exports = sendSMS