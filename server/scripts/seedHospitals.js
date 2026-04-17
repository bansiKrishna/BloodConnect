const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, '../database/bloodbank.db');

const db = new sqlite3.Database(dbPath);

console.log("Seeding fake Berhampur hospitals...");

db.serialize(() => {
    const berhampurHospitals = [
        { name: "MKCG Medical College & Hospital", email: "mkcg@test.com", phone: "0680-2292746", lat: 19.3235, lon: 84.8050, type: "hospital", addr: "Medical College Rd, Berhampur" },
        { name: "City Hospital", email: "cityhosp@test.com", phone: "0680-2220022", lat: 19.3155, lon: 84.7940, type: "hospital", addr: "Old Bus Stand, Berhampur" },
        { name: "Christian Hospital", email: "christianhosp@test.com", phone: "0680-2220111", lat: 19.3100, lon: 84.8000, type: "hospital", addr: "Gosaninuagaon, Berhampur" },
        { name: "Sanjivani Hospital", email: "sanjivani@test.com", phone: "0680-2211234", lat: 19.3250, lon: 84.7950, type: "hospital", addr: "Prem Nagar, Berhampur" },
        { name: "Gopalpur Healthcare", email: "gopalpur1@test.com", phone: "0680-2233444", lat: 19.2630, lon: 84.9050, type: "hospital", addr: "Gopalpur on Sea" }
    ];

    const stmt = db.prepare(`
        INSERT INTO facilities (name, email, phone, type, location, address, lat, lon, password) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'mockpass')
    `);
    
    let added = 0;
    
    db.run("DELETE FROM facilities WHERE email LIKE '%@test.com'", [], (err) => {
        berhampurHospitals.forEach(h => {
            stmt.run(h.name, h.email, h.phone, h.type, h.addr, h.addr, h.lat, h.lon);
            added++;
        });
        stmt.finalize();

        console.log(`Successfully seeded ${added} Berhampur hospitals.`);
        setTimeout(() => {
            db.close();
            console.log("Done.");
        }, 500);
    });
});
