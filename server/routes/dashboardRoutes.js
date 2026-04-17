const express = require('express');
const router = express.Router();
const dc = require('../controllers/dashboardController');

router.get('/stats', dc.getStats);
router.get('/donors', dc.getDonors);
router.get('/requests', dc.getRequests);
router.get('/requests/:id', dc.getRequestById);
router.post('/requests', dc.createRequest);
router.patch('/requests/:id/status', dc.updateRequestStatus);
router.get('/verifications', dc.getVerificationRequests);
router.patch('/verifications/:id', dc.updateVerificationStatus);
router.get('/facility-directory', dc.getFacilityDirectory);
router.post('/facility-directory', dc.createFacilityDirectory);
router.get('/organizations', dc.getOrganizations);
router.get('/inventory', dc.getInventory);
router.post('/inventory', dc.addInventory);

module.exports = router;
