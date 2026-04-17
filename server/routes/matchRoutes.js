const express = require('express');
const router = express.Router();
const matchController = require('../controllers/matchController');

// Route to perform algorithms and find eligible donors
router.post('/find', matchController.findMatch);

// Route to notify donors
router.post('/notify', matchController.notifyDonor);

module.exports = router;
