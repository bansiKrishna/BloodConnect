const db = require('../database/db');

// Register Donor
exports.registerDonor = (req, res) => {
    const { fullName, email, phone, bloodGroup, location, password, aadhaarNumber } = req.body;
    const aadhaarFile = req.file;
    
    if (!fullName || !email || !password || !phone || !aadhaarNumber || !aadhaarFile) {
        return res.status(400).json({ error: 'Please provide all required fields' });
    }
    if (!/^\d{12}$/.test(aadhaarNumber)) {
        return res.status(400).json({ error: 'Aadhaar number must be exactly 12 digits' });
    }

    // Generate random mock coordinates around Berhampur so they realistically show up on the Tracker Map
    const mockLat = 19.3149 + (Math.random() * 0.04 - 0.02);
    const mockLon = 84.7940 + (Math.random() * 0.04 - 0.02);

    const aadhaarFilePath = process.env.RENDER ? `/tmp/uploads/aadhaar/${aadhaarFile.filename}` : `/uploads/aadhaar/${aadhaarFile.filename}`;
    const sql = `INSERT INTO donors (name, email, phone, blood_group, location, address, lat, lon, responsiveness, aadhaar_number, aadhaar_file_path, aadhaar_file_type, verification_status, last_donation_date, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NULL, ?)`;
    db.run(sql, [fullName, email, phone, bloodGroup || 'O+', location || '', location || '', mockLat, mockLon, 1.0, aadhaarNumber, aadhaarFilePath, aadhaarFile.mimetype, password], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(400).json({ error: 'Email already exists' });
            }
            return res.status(500).json({ error: err.message });
        }

        const donorId = this.lastID;
        const verifySql = `INSERT INTO donor_verification_requests (donor_id, donor_name, donor_phone, aadhaar_number, aadhaar_file_path, aadhaar_file_type, status) VALUES (?, ?, ?, ?, ?, ?, 'pending')`;
        db.run(verifySql, [donorId, fullName, phone, aadhaarNumber, aadhaarFilePath, aadhaarFile.mimetype], function(verifyErr) {
            if (verifyErr) {
                return res.status(500).json({ error: verifyErr.message });
            }
            res.status(201).json({
                message: 'Donor registered successfully and sent for admin verification',
                id: donorId,
                role: 'donor',
                verificationStatus: 'pending'
            });
        });
    });
};

// Register Facility
exports.registerFacility = (req, res) => {
    const { facilityName, facilityType, email, phone, location, password } = req.body;

    if (!facilityName || !email || !password || !facilityType) {
        return res.status(400).json({ error: 'Please provide all required fields' });
    }

    const sql = `INSERT INTO facilities (name, type, email, phone, location, password) VALUES (?, ?, ?, ?, ?, ?)`;
    db.run(sql, [facilityName, facilityType, email, phone, location || '', password], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(400).json({ error: 'Email already exists' });
            }
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ message: 'Facility registered successfully', id: this.lastID, role: facilityType });
    });
};

// Register Admin
exports.registerAdmin = (req, res) => {
    const { fullName, employeeId, email, phone, designation, department, password, secretKey } = req.body;

    if (!fullName || !email || !password || !employeeId) {
        return res.status(400).json({ error: 'Please provide all required fields' });
    }

    if (secretKey !== 'ADMIN2024') {
        return res.status(403).json({ error: 'Invalid secret key' });
    }

    const sql = `INSERT INTO admins (name, employee_id, email, phone, designation, department, password) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    db.run(sql, [fullName, employeeId, email, phone, designation || '', department || '', password], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(400).json({ error: 'Email already exists' });
            }
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ message: 'Admin registered successfully', id: this.lastID, role: 'admin' });
    });
};

// Login
exports.login = (req, res) => {
    const { role, email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Please provide email and password' });
    }

    let table = 'donors';
    if (role === 'hospital' || role === 'lab' || role === 'blood_bank') {
        table = 'facilities';
    } else if (role === 'admin') {
        table = 'admins';
    }
    
    let sql = `SELECT * FROM ${table} WHERE email = ? AND password = ?`;
    let params = [email, password];

    db.get(sql, params, (err, user) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        
        // Find the actual role for facilities.
        // Normalize facility subtypes so login redirects consistently.
        let finalRole = role;
        if (table === 'facilities') {
            const facilityType = (user.type || '').toLowerCase();
            if (facilityType === 'lab') {
                finalRole = 'lab';
            } else {
                finalRole = 'hospital';
            }
        }
        if (table === 'admins') {
            finalRole = 'admin';
        }
        
        // Don't send the password back
        delete user.password;
        res.json({ message: 'Login successful', role: finalRole, user });
    });
};

// Delete account for donor/admin/facility
exports.deleteAccount = (req, res) => {
    const { role, userId, email } = req.body;
    if (!role || (!userId && !email)) {
        return res.status(400).json({ error: 'role and user identifier are required' });
    }

    const byClause = userId ? 'id = ?' : 'email = ?';
    const byValue = userId || email;

    if (role === 'donor') {
        db.get(`SELECT id FROM donors WHERE ${byClause}`, [byValue], (findErr, donor) => {
            if (findErr) return res.status(500).json({ error: findErr.message });
            if (!donor) return res.status(404).json({ error: 'Donor account not found' });

            db.serialize(() => {
                db.run(`DELETE FROM donor_verification_requests WHERE donor_id = ?`, [donor.id], () => {});
                db.run(`DELETE FROM requests WHERE requester_type = 'donor' AND requester_id = ?`, [donor.id], () => {});
                db.run(`DELETE FROM donors WHERE id = ?`, [donor.id], function(delErr) {
                    if (delErr) return res.status(500).json({ error: delErr.message });
                    res.json({ success: true, message: 'Donor account deleted successfully' });
                });
            });
        });
        return;
    }

    if (role === 'admin') {
        db.run(`DELETE FROM admins WHERE ${byClause}`, [byValue], function(err) {
            if (err) return res.status(500).json({ error: err.message });
            if (!this.changes) return res.status(404).json({ error: 'Admin account not found' });
            res.json({ success: true, message: 'Admin account deleted successfully' });
        });
        return;
    }

    if (role === 'hospital' || role === 'lab' || role === 'blood_bank') {
        db.get(`SELECT id FROM facilities WHERE ${byClause}`, [byValue], (findErr, facility) => {
            if (findErr) return res.status(500).json({ error: findErr.message });
            if (!facility) return res.status(404).json({ error: 'Facility account not found' });

            db.serialize(() => {
                db.run(`DELETE FROM facility_inventory WHERE facility_id = ?`, [facility.id], () => {});
                db.run(`DELETE FROM requests WHERE requester_type = 'facility' AND requester_id = ?`, [facility.id], () => {});
                db.run(`DELETE FROM facilities WHERE id = ?`, [facility.id], function(delErr) {
                    if (delErr) return res.status(500).json({ error: delErr.message });
                    res.json({ success: true, message: 'Facility account deleted successfully' });
                });
            });
        });
        return;
    }

    res.status(400).json({ error: 'Unsupported role' });
};

