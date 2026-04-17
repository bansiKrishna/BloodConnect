const db = require('../database/db');

// GET /api/dashboard/stats
exports.getStats = (req, res) => {
    db.serialize(() => {
        const result = {};

        db.get("SELECT COUNT(*) as total FROM donors", [], (err, row) => {
            result.totalDonors = err ? 0 : row.total;

            db.get("SELECT COUNT(*) as total FROM facilities", [], (err, row) => {
                result.totalFacilities = err ? 0 : row.total;

                db.get("SELECT COUNT(*) as total FROM requests", [], (err, row) => {
                    result.totalRequests = err ? 0 : row.total;

                    db.get("SELECT COUNT(*) as total FROM requests WHERE status='pending'", [], (err, row) => {
                        result.pendingRequests = err ? 0 : row.total;

                        db.get("SELECT COUNT(*) as total FROM requests WHERE status='fulfilled'", [], (err, row) => {
                            result.fulfilledRequests = err ? 0 : row.total;

                            db.get("SELECT COUNT(*) as total FROM requests WHERE urgency='critical' OR urgency='emergency'", [], (err, row) => {
                                result.emergencyRequests = err ? 0 : row.total;
                            db.get("SELECT COUNT(*) as total FROM donor_verification_requests WHERE status='pending'", [], (verifyErr, verifyRow) => {
                                result.pendingVerifications = verifyErr ? 0 : verifyRow.total;
                                res.json({ success: true, stats: result });
                            });
                            });
                        });
                    });
                });
            });
        });
    });
};

// GET /api/dashboard/donors?limit=20
exports.getDonors = (req, res) => {
    const limit = parseInt(req.query.limit) || 20;
    const bloodGroup = req.query.blood_group || null;

    let query = "SELECT id, name, email, phone, blood_group, location, address, lat, lon, last_donation_date, responsiveness, created_at FROM donors";
    let params = [];

    if (bloodGroup) {
        query += " WHERE blood_group = ?";
        params.push(bloodGroup);
    }

    query += " ORDER BY created_at DESC LIMIT ?";
    params.push(limit);

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, donors: rows, total: rows.length });
    });
};

// GET /api/dashboard/requests?limit=20
exports.getRequests = (req, res) => {
    const limit = parseInt(req.query.limit) || 20;
    const query = `
        SELECT r.id, r.blood_group, r.units, r.urgency, r.status, r.created_at,
               COALESCE(d.name, f.name, 'Unknown') as requester_name,
               r.requester_type
        FROM requests r
        LEFT JOIN donors d ON r.requester_id = d.id AND r.requester_type = 'donor'
        LEFT JOIN facilities f ON r.requester_id = f.id AND r.requester_type = 'facility'
        ORDER BY r.created_at DESC
        LIMIT ?
    `;
    db.all(query, [limit], (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, requests: rows, total: rows.length });
    });
};

// POST /api/dashboard/requests  — submit a new blood request
exports.createRequest = (req, res) => {
    const { blood_group, units, urgency, requester_id, requester_type, notes } = req.body;

    if (!blood_group || !units) {
        return res.status(400).json({ success: false, message: 'blood_group and units are required' });
    }

    const query = `INSERT INTO requests (requester_id, requester_type, blood_group, units, urgency, notes, status) VALUES (?, ?, ?, ?, ?, ?, 'pending')`;
    db.run(query, [requester_id || null, requester_type || 'facility', blood_group, units, urgency || 'normal', notes || ''], function(err) {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, message: 'Blood request submitted!', requestId: 'REQ-' + this.lastID });
    });
};

// PATCH /api/dashboard/requests/:id/status
exports.updateRequestStatus = (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    if (!['pending', 'fulfilled', 'cancelled'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    db.run("UPDATE requests SET status = ? WHERE id = ?", [status, id], function(err) {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, message: `Request #${id} marked as ${status}` });
    });
};

// GET /api/dashboard/verifications?status=pending
exports.getVerificationRequests = (req, res) => {
    const status = req.query.status || 'pending';
    const allowedStatus = ['pending', 'approved', 'rejected'];
    if (!allowedStatus.includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid verification status' });
    }
    const query = `
        SELECT id, donor_id, donor_name, donor_phone, aadhaar_number, aadhaar_file_path, aadhaar_file_type, status, created_at
        FROM donor_verification_requests
        WHERE status = ?
        ORDER BY created_at DESC
    `;
    db.all(query, [status], (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, requests: rows, total: rows.length });
    });
};

// PATCH /api/dashboard/verifications/:id
exports.updateVerificationStatus = (req, res) => {
    const verificationId = req.params.id;
    const status = req.body.status;
    const allowedStatus = ['pending', 'approved', 'rejected'];
    if (!allowedStatus.includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid verification status' });
    }

    db.get(
        `SELECT donor_id FROM donor_verification_requests WHERE id = ?`,
        [verificationId],
        (findErr, row) => {
            if (findErr) return res.status(500).json({ success: false, message: findErr.message });
            if (!row) return res.status(404).json({ success: false, message: 'Verification request not found' });

            db.run(
                `UPDATE donor_verification_requests SET status = ? WHERE id = ?`,
                [status, verificationId],
                function(updateErr) {
                    if (updateErr) return res.status(500).json({ success: false, message: updateErr.message });

                    db.run(
                        `UPDATE donors SET verification_status = ? WHERE id = ?`,
                        [status, row.donor_id],
                        function(donorErr) {
                            if (donorErr) return res.status(500).json({ success: false, message: donorErr.message });
                            res.json({ success: true, message: `Verification marked as ${status}` });
                        }
                    );
                }
            );
        }
    );
};

// GET /api/dashboard/facility-directory
exports.getFacilityDirectory = (req, res) => {
    const category = req.query.category;
    let query = `
        SELECT id, external_id, name, category, facility_type, services, address, phone, availability, latitude, longitude, source, created_at
        FROM medical_facilities
    `;
    const params = [];
    if (category && ['hospital', 'lab'].includes(category)) {
        query += ' WHERE category = ?';
        params.push(category);
    }
    query += ' ORDER BY created_at DESC';
    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, facilities: rows, total: rows.length });
    });
};

// POST /api/dashboard/facility-directory
exports.createFacilityDirectory = (req, res) => {
    const {
        external_id,
        name,
        category,
        facility_type,
        services,
        address,
        phone,
        availability,
        latitude,
        longitude
    } = req.body;

    if (!external_id || !name || !category || !facility_type || !address) {
        return res.status(400).json({ success: false, message: 'external_id, name, category, facility_type and address are required' });
    }
    if (!['hospital', 'lab'].includes(category)) {
        return res.status(400).json({ success: false, message: 'category must be hospital or lab' });
    }

    const query = `
        INSERT INTO medical_facilities
        (external_id, name, category, facility_type, services, address, phone, availability, latitude, longitude, source)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'admin')
    `;
    db.run(
        query,
        [
            external_id.trim(),
            name.trim(),
            category,
            facility_type.trim(),
            services || '',
            address.trim(),
            phone || 'NA',
            availability || '',
            latitude || null,
            longitude || null
        ],
        function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(400).json({ success: false, message: 'Facility ID already exists' });
                }
                return res.status(500).json({ success: false, message: err.message });
            }
            res.status(201).json({ success: true, message: 'Facility added successfully', id: this.lastID });
        }
    );
};

// GET /api/dashboard/organizations
exports.getOrganizations = (req, res) => {
    const query = `
        SELECT id, external_id, name, org_type, services, address, phone, created_at
        FROM donation_organizations
        ORDER BY created_at DESC
    `;
    db.all(query, [], (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, organizations: rows, total: rows.length });
    });
};

// GET /api/dashboard/requests/:id
exports.getRequestById = (req, res) => {
    const id = req.params.id;
    const query = `
        SELECT r.id, r.requester_id, r.requester_type, r.blood_group, r.units, r.urgency, r.notes, r.status, r.created_at,
               COALESCE(d.name, f.name, 'Unknown') as requester_name,
               COALESCE(d.phone, f.phone, '') as requester_phone
        FROM requests r
        LEFT JOIN donors d ON r.requester_id = d.id AND r.requester_type = 'donor'
        LEFT JOIN facilities f ON r.requester_id = f.id AND r.requester_type = 'facility'
        WHERE r.id = ?
    `;
    db.get(query, [id], (err, row) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        if (!row) return res.status(404).json({ success: false, message: 'Request not found' });
        res.json({ success: true, request: row });
    });
};

// GET /api/dashboard/inventory?facility_id=1
exports.getInventory = (req, res) => {
    const facilityId = req.query.facility_id;
    let query = `
        SELECT fi.id, fi.facility_id, fi.blood_group, fi.units, fi.availability_status, fi.notes, fi.created_at,
               f.name as facility_name
        FROM facility_inventory fi
        LEFT JOIN facilities f ON f.id = fi.facility_id
    `;
    const params = [];
    if (facilityId) {
        query += ' WHERE fi.facility_id = ?';
        params.push(facilityId);
    }
    query += ' ORDER BY fi.created_at DESC';
    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.json({ success: true, inventory: rows, total: rows.length });
    });
};

// POST /api/dashboard/inventory
exports.addInventory = (req, res) => {
    const { facility_id, blood_group, units, availability_status, notes } = req.body;
    if (!facility_id || !blood_group || !units) {
        return res.status(400).json({ success: false, message: 'facility_id, blood_group and units are required' });
    }
    const query = `
        INSERT INTO facility_inventory (facility_id, blood_group, units, availability_status, notes)
        VALUES (?, ?, ?, ?, ?)
    `;
    db.run(query, [facility_id, blood_group, units, availability_status || 'available', notes || ''], function(err) {
        if (err) return res.status(500).json({ success: false, message: err.message });
        res.status(201).json({ success: true, message: 'Inventory added', id: this.lastID });
    });
};
