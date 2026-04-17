const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const authController = require('../controllers/authController');

const uploadDir = path.resolve(__dirname, '../uploads/aadhaar');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const safeExt = path.extname(file.originalname || '').toLowerCase();
        cb(null, `aadhaar-${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
        if (!allowed.includes(file.mimetype)) {
            return cb(new Error('Only PDF, JPG and PNG files are allowed'));
        }
        cb(null, true);
    }
});

router.post('/register-donor', upload.single('aadhaarFile'), authController.registerDonor);
router.post('/register-facility', authController.registerFacility);
router.post('/register-admin', authController.registerAdmin);
router.post('/login', authController.login);
router.delete('/delete-account', authController.deleteAccount);

module.exports = router;
