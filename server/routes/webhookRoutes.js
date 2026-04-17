const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');

// Twilio Webhook (receives POST)
router.post('/sms', webhookController.handleSmsReply);

// Polling status (receives GET from frontend)
router.get('/status', webhookController.checkDonorStatus);

module.exports = router;
