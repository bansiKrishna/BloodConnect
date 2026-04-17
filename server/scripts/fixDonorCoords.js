/**
 * Fix donors that registered before the geo-coordinate fix.
 * Any donor with lat/lon outside Berhampur region (or null) gets
 * assigned a realistic random coordinate inside Berhampur.
 */
const db = require('../database/db');

const BERHAMPUR_LAT = 19.3149;
const BERHAMPUR_LON = 84.7940;
const SPREAD = 0.05; // ~5km spread radius

function randomBerhampurCoord() {
    return {
        lat: BERHAMPUR_LAT + (Math.random() * SPREAD * 2 - SPREAD),
        lon: BERHAMPUR_LON + (Math.random() * SPREAD * 2 - SPREAD)
    };
}

db.all("SELECT id, name, lat, lon FROM donors", [], (err, donors) => {
    if (err) { console.error(err); return; }

    let fixed = 0;
    donors.forEach(d => {
        const isOutside = !d.lat || !d.lon ||
            Math.abs(d.lat - BERHAMPUR_LAT) > 1.0 || // more than ~110km off
            Math.abs(d.lon - BERHAMPUR_LON) > 1.0;

        if (isOutside) {
            const { lat, lon } = randomBerhampurCoord();
            db.run("UPDATE donors SET lat = ?, lon = ? WHERE id = ?", [lat, lon, d.id], (err) => {
                if (err) console.error(`❌ Failed to fix ${d.name}:`, err.message);
                else console.log(`✅ Fixed coords for: ${d.name} → (${lat.toFixed(4)}, ${lon.toFixed(4)})`);
            });
            fixed++;
        } else {
            console.log(`✔  OK: ${d.name} (${d.lat}, ${d.lon})`);
        }
    });

    setTimeout(() => {
        console.log(`\n🎯 Done. Fixed ${fixed} donor(s).`);
        db.close();
    }, 1000);
});
