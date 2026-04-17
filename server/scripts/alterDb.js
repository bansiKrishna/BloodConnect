const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, '../database/bloodbank.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error connecting to the database:', err.message);
        return;
    }
    console.log('Connected to the SQLite database. Altering table...');
});

db.serialize(() => {
    db.run("ALTER TABLE donors ADD COLUMN aadhar_number TEXT;", (err) => {
        if(err) console.log(err.message);
        else console.log("Added aadhar_number");
    });
    db.run("ALTER TABLE donors ADD COLUMN aadhar_file_path TEXT;", (err) => {
        if(err) console.log(err.message);
        else console.log("Added aadhar_file_path");
    });
    db.run("ALTER TABLE donors ADD COLUMN status TEXT DEFAULT 'pending';", (err) => {
        if(err) console.log(err.message);
        else console.log("Added status pending");
    });
});

db.close();
