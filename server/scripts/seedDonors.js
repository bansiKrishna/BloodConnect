const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, '../database/bloodbank.db');

const db = new sqlite3.Database(dbPath);

console.log("Adding columns to existing tables...");

// Try to alter tables. Ignore errors if columns already exist.
const alterQueries = [
    "ALTER TABLE donors ADD COLUMN address TEXT",
    "ALTER TABLE donors ADD COLUMN lat REAL",
    "ALTER TABLE donors ADD COLUMN lon REAL",
    "ALTER TABLE donors ADD COLUMN last_donation_date DATE",
    "ALTER TABLE donors ADD COLUMN responsiveness REAL DEFAULT 1.0",
    "ALTER TABLE facilities ADD COLUMN address TEXT",
    "ALTER TABLE facilities ADD COLUMN lat REAL",
    "ALTER TABLE facilities ADD COLUMN lon REAL"
];

db.serialize(() => {
    alterQueries.forEach(query => {
        db.run(query, (err) => {
            if (err) {
                console.log(`Note: Column might already exist. Query: ${query}`);
            } else {
                console.log(`Executed: ${query}`);
            }
        });
    });

    console.log("Seeding mock donors with geo-coordinates...");
    
    // Some coordinates around normal bounding box in India (Delhi mostly)
    // Delhi center: 28.6139, 77.2090
    const mockDonors = [
        { name: "Rahul Kumar", email: "rahul@test.com", phone: "9876543210", bg: "O+", lat: 28.6250, lon: 77.2100, date: "2023-01-01", resp: 0.9 }, // Eligible (old date)
        { name: "Priya M.", email: "priya@test.com", phone: "9876543211", bg: "A+", lat: 28.6050, lon: 77.2000, date: "2023-05-15", resp: 0.8 }, // Eligible
        { name: "Arjun S.", email: "arjun@test.com", phone: "9876543212", bg: "B+", lat: 28.6300, lon: 77.2200, date: "2024-03-20", resp: 0.95 }, // Not eligible (too recent)
        { name: "Neha G.", email: "neha@test.com", phone: "9876543213", bg: "O-", lat: 28.6100, lon: 77.2300, date: "2023-11-10", resp: 1.0 }, // Eligible (rare)
        { name: "Vikas L.", email: "vikas@test.com", phone: "9876543214", bg: "AB-", lat: 28.6500, lon: 77.1800, date: "2023-08-05", resp: 0.7 }, // Eligible (far, rare)
        { name: "Sneha K.", email: "sneha@test.com", phone: "9876543215", bg: "A-", lat: 28.5900, lon: 77.2500, date: "2022-12-12", resp: 0.85 } // Eligible
    ];

    const stmt = db.prepare("INSERT OR IGNORE INTO donors (name, email, phone, blood_group, password, lat, lon, last_donation_date, responsiveness) VALUES (?, ?, ?, ?, 'mockpass', ?, ?, ?, ?)");
    
    mockDonors.forEach(d => {
        stmt.run(d.name, d.email, d.phone, d.bg, d.lat, d.lon, d.date, d.resp);
    });
    stmt.finalize();

    console.log("Mock data seeding attempted.");
    
    setTimeout(() => {
        db.close();
        console.log("Done.");
    }, 1000);
});
