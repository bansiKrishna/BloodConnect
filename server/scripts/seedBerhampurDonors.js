const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, '../database/bloodbank.db');

const db = new sqlite3.Database(dbPath);

console.log("Seeding fake Berhampur donors...");

db.serialize(() => {    
    // Berhampur center roughly: 19.3149 N, 84.7940 E
    // generating mock donors spread around Berhampur Localities:
    // Medical (MKCG) area, Tata Benz square, Gate Bazar, Aska Road, Gosaninuagaon, Gopalpur (slightly far approx 15km)
    
    const berhampurDonors = [
        { name: "Suresh Das", email: "suresh.brm@test.com", phone: "9876500001", bg: "O+", lat: 19.3245, lon: 84.8052, date: "2023-01-10", resp: 0.95, addr: "MKCG Medical College Area, Berhampur" },
        { name: "Anita Patra", email: "anita.p@test.com", phone: "9876500002", bg: "A+", lat: 19.3089, lon: 84.7995, date: "2023-11-20", resp: 0.88, addr: "Gate Bazar, Berhampur" },
        { name: "Ramesh Sahu", email: "ramesh.sh@test.com", phone: "9876500003", bg: "B+", lat: 19.3005, lon: 84.8010, date: "2022-09-15", resp: 0.70, addr: "Gosaninuagaon, Berhampur" },
        { name: "Priyanka Mishra", email: "priyanka.m@test.com", phone: "9876500004", bg: "O-", lat: 19.3300, lon: 84.7900, date: "2023-12-05", resp: 1.0, addr: "Aska Road, Berhampur" },
        { name: "Lipun Pradhan", email: "lipun.p@test.com", phone: "9876500005", bg: "AB+", lat: 19.3180, lon: 84.7850, date: "2024-01-15", resp: 0.9, addr: "Tata Benz Square, Berhampur" },
        { name: "Jatin Mohanty", email: "jatin.m@test.com", phone: "9876500006", bg: "A-", lat: 19.3120, lon: 84.7920, date: "2023-06-25", resp: 0.85, addr: "Bada Bazar, Berhampur" },
        { name: "Sunita Behera", email: "sunita.b@test.com", phone: "9876500007", bg: "O+", lat: 19.3400, lon: 84.7800, date: "2023-08-30", resp: 0.92, addr: "Ganjam bypass, Berhampur" },
        { name: "Alok Panigrahi", email: "alok.p@test.com", phone: "9876500008", bg: "B-", lat: 19.3150, lon: 84.8050, date: "2022-11-11", resp: 0.8, addr: "Kamapalli, Berhampur" },
        { name: "Tapas Sethi", email: "tapas.s@test.com", phone: "9876500009", bg: "B+", lat: 19.3350, lon: 84.8100, date: "2023-05-18", resp: 0.95, addr: "Lanjipalli, Berhampur" },
        { name: "Swati Nayak", email: "swati.n@test.com", phone: "9876500010", bg: "AB-", lat: 19.2650, lon: 84.9000, date: "2023-03-22", resp: 0.98, addr: "Gopalpur on Sea, Ganjam" }, // further away to test progressive radius
        { name: "Jyoti Ranjan", email: "jyoti.r@test.com", phone: "9876500011", bg: "O+", lat: 19.3100, lon: 84.7900, date: "2024-04-10", resp: 0.90, addr: "Gandhi Nagar, Berhampur" } // Recently donated, should be excluded by 90-day rule
    ];

    const stmt = db.prepare(`
        INSERT INTO donors (name, email, phone, blood_group, password, lat, lon, last_donation_date, responsiveness, address) 
        VALUES (?, ?, ?, ?, 'mockpass', ?, ?, ?, ?, ?)
    `);
    
    let added = 0;
    
    // Clear out existing test/mock users optionally, or just add
    db.run("DELETE FROM donors WHERE email LIKE '%@test.com'", [], (err) => {
        if(err) console.error("Could not delete old test donors", err);
        
        berhampurDonors.forEach(d => {
            stmt.run(d.name, d.email, d.phone, d.bg, d.lat, d.lon, d.date, d.resp, d.addr);
            added++;
        });
        stmt.finalize();

        console.log(`Successfully seeded ${added} Berhampur donors into the database.`);
        
        setTimeout(() => {
            db.close();
            console.log("Done.");
        }, 500);
    });
});
