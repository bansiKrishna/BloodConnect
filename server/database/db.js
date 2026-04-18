const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Use /tmp for Render's writable filesystem
const dbPath = process.env.RENDER ? '/tmp/bloodbank.db' : path.resolve(__dirname, 'bloodbank.db');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to the database:', err.message);
    } else {
        console.log('Connected to the SQLite database at:', dbPath);
        initializeDB();
    }
});

function initializeDB() {
    db.serialize(() => {
        // Create Donors Table
        db.run(`CREATE TABLE IF NOT EXISTS donors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            phone TEXT,
            blood_group TEXT NOT NULL,
            location TEXT,
            address TEXT,
            lat REAL,
            lon REAL,
            last_donation_date DATE,
            responsiveness REAL DEFAULT 1.0,
            aadhaar_number TEXT,
            aadhaar_file_path TEXT,
            aadhaar_file_type TEXT,
            verification_status TEXT DEFAULT 'pending',
            password TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Keep existing DBs compatible by adding new columns if they do not exist.
        db.run(`ALTER TABLE donors ADD COLUMN aadhaar_number TEXT`, () => {});
        db.run(`ALTER TABLE donors ADD COLUMN aadhaar_file_path TEXT`, () => {});
        db.run(`ALTER TABLE donors ADD COLUMN aadhaar_file_type TEXT`, () => {});
        db.run(`ALTER TABLE donors ADD COLUMN verification_status TEXT DEFAULT 'pending'`, () => {});

        // Create Facilities Table (Hospitals and Labs)
        db.run(`CREATE TABLE IF NOT EXISTS facilities (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            phone TEXT,
            type TEXT NOT NULL, -- 'hospital' or 'lab'
            location TEXT,
            address TEXT,
            lat REAL,
            lon REAL,
            password TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Create Blood Requests Table
        db.run(`CREATE TABLE IF NOT EXISTS requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            requester_id INTEGER,
            requester_type TEXT, -- 'facility' or 'donor'
            blood_group TEXT NOT NULL,
            units INTEGER NOT NULL,
            urgency TEXT,
            notes TEXT,
            status TEXT DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
        db.run(`ALTER TABLE requests ADD COLUMN notes TEXT`, () => {});

        // Facility inventory records
        db.run(`CREATE TABLE IF NOT EXISTS facility_inventory (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            facility_id INTEGER,
            blood_group TEXT NOT NULL,
            units INTEGER NOT NULL,
            availability_status TEXT DEFAULT 'available',
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(facility_id) REFERENCES facilities(id)
        )`);

        // Create Donor Responses Table (For WhatsApp Webhook)
        db.run(`CREATE TABLE IF NOT EXISTS donor_responses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            donor_phone TEXT NOT NULL,
            tracking_id TEXT NOT NULL,
            response TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Create Admins Table
        db.run(`CREATE TABLE IF NOT EXISTS admins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            employee_id TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            phone TEXT,
            designation TEXT,
            department TEXT,
            password TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Verification queue for admin review
        db.run(`CREATE TABLE IF NOT EXISTS donor_verification_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            donor_id INTEGER NOT NULL,
            donor_name TEXT NOT NULL,
            donor_phone TEXT NOT NULL,
            aadhaar_number TEXT NOT NULL,
            aadhaar_file_path TEXT NOT NULL,
            aadhaar_file_type TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(donor_id) REFERENCES donors(id)
        )`);

        // Directory table for curated hospitals/labs around Berhampur
        db.run(`CREATE TABLE IF NOT EXISTS medical_facilities (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            external_id TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            category TEXT NOT NULL, -- 'hospital' | 'lab'
            facility_type TEXT NOT NULL,
            services TEXT,
            address TEXT NOT NULL,
            phone TEXT,
            availability TEXT,
            latitude REAL,
            longitude REAL,
            source TEXT DEFAULT 'seed',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Directory table for blood donation organizations/NGOs
        db.run(`CREATE TABLE IF NOT EXISTS donation_organizations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            external_id TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            org_type TEXT NOT NULL,
            services TEXT,
            address TEXT NOT NULL,
            phone TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Seed hospitals/labs (safe with UNIQUE external_id)
        db.run(
            `INSERT OR IGNORE INTO medical_facilities (external_id, name, category, facility_type, services, address, phone, availability, latitude, longitude, source) VALUES
            ('H001', 'MKCG Medical College & Hospital Blood Bank', 'hospital', 'Government Hospital', 'Blood Bank, Emergency, Transfusion', 'NH-59, Berhampur, Ganjam, Odisha', '0680-2292534, 9861193566', '24x7', 19.3149, 84.7941, 'seed'),
            ('H002', 'City Hospital Berhampur', 'hospital', 'Government Hospital', 'Emergency, Blood Storage', 'Berhampur, Odisha', 'NA', '24x7', NULL, NULL, 'seed'),
            ('H003', 'District Headquarters Hospital (Chhatrapur)', 'hospital', 'Government Hospital', 'Blood Bank, Emergency', 'Chhatrapur, Ganjam, Odisha', 'NA', '24x7', NULL, NULL, 'seed'),
            ('L001', 'Dr Lal PathLabs', 'lab', 'Private Lab', 'Blood Test, CBC, Pathology', 'Berhampur, Odisha', 'NA', '8 AM - 8 PM', NULL, NULL, 'seed'),
            ('L002', 'Apollo Diagnostics', 'lab', 'Private Lab', 'Full Body Test, Blood Screening', 'Berhampur, Odisha', 'NA', '8 AM - 9 PM', NULL, NULL, 'seed'),
            ('L003', 'Thyrocare Collection Center', 'lab', 'Private Lab', 'Blood Test, Home Collection', 'Berhampur, Odisha', 'NA', 'Morning Only', NULL, NULL, 'seed')`
        );

        // Seed organizations (safe with UNIQUE external_id)
        db.run(
            `INSERT OR IGNORE INTO donation_organizations (external_id, name, org_type, services, address, phone) VALUES
            ('O001', 'Odisha Red Cross Blood Bank (Chhatrapur)', 'NGO / Government', 'Blood Donation, Blood Supply', 'SDH Chhatrapur, Ganjam, Odisha', '9678932487'),
            ('O002', 'Odisha Red Cross Society (Berhampur Volunteers)', 'NGO', 'Blood Donation Camps, Emergency Donor Network', 'Berhampur, Odisha', 'NA'),
            ('O003', 'Silk City Volunteer Blood Donor Network', 'Community Group', 'Emergency Blood Donation, Donor Matching', 'Berhampur, Odisha', 'NA')`
        );
    });
}

module.exports = db;
