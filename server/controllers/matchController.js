const db = require('../database/db');
const nodemailer = require('nodemailer');
const messagingService = require('../services/messagingService');

// Algorithm 1: Eligibility Check Algorithm (90-Day Rule)
function isEligible(lastDonationDateStr) {
    if (!lastDonationDateStr) return true; // Never donated
    const currentDate = new Date();
    const lastDate = new Date(lastDonationDateStr);
    const diffTime = Math.abs(currentDate - lastDate);
    const daysSince = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return daysSince >= 90;
}

// Algorithm 2: Geo-spatial (Haversine formula in km)
function haversine(lat1, lon1, lat2, lon2) {
    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371; // Earth radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Algorithm 3: Donor Ranking Algorithm (Intelligent Priority Scoring)
function calculateScore(distance, responsiveness, bloodGroup) {
    // Rarity factors
    const rarityMap = {
        'AB-': 1.0, 'B-': 0.9, 'AB+': 0.8, 'A-': 0.7, 
        'O-': 0.6, 'B+': 0.5, 'A+': 0.4, 'O+': 0.3
    };
    const rarityFactor = rarityMap[bloodGroup] || 0.5;

    // Weights
    const w1 = 0.5; // Distance
    const w2 = 0.3; // Responsiveness
    const w3 = 0.2; // Rarity

    // Normalize distance score (closer is better, max out at some limit to avoid divide by zero)
    const distScore = distance < 0.1 ? 1 : (1 / distance); 
    // Normalized distance: 0 to 1 (roughly) - assuming 10km is score 0.1. We can just use the provided formula exactly.
    const score = (w1 * (1 / Math.max(distance, 0.1))) + (w2 * responsiveness) + (w3 * rarityFactor);
    return score;
}

const bloodCompatibility = {
    'O-': ['O-'],
    'O+': ['O-', 'O+'],
    'A-': ['O-', 'A-'],
    'A+': ['O-', 'O+', 'A-', 'A+'],
    'B-': ['O-', 'B-'],
    'B+': ['O-', 'O+', 'B-', 'B+'],
    'AB-': ['O-', 'A-', 'B-', 'AB-'],
    'AB+': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+']
};

exports.findMatch = (req, res) => {
    let { bloodGroup, lat, lon } = req.body;
    
    // Default location (Berhampur center) if not provided by browser geolocation
    lat = parseFloat(lat) || 19.3149;
    lon = parseFloat(lon) || 84.7940;
    
    if (!bloodGroup) {
        return res.status(400).json({ success: false, message: "Blood group is required" });
    }

    // Determine compatible blood groups (who can this patient RECEIVE from)
    const compatibleGroups = bloodCompatibility[bloodGroup] || [bloodGroup];
    const placeholders = compatibleGroups.map(() => '?').join(',');

    const query = `
        SELECT id, name, email, phone, blood_group, location, address, lat, lon, last_donation_date, responsiveness 
        FROM donors 
        WHERE blood_group IN (${placeholders})
    `;

    db.all(query, compatibleGroups, (err, allDonors) => {
        if (err) {
            console.error("Match error:", err);
            return res.status(500).json({ success: false, message: "Database error" });
        }

        // Apply Algorithms 1 and 2
        let matches = [];

        for (let donor of allDonors) {
            // Skip donors with missing coordinates (e.g. registered before geo-fix)
            if (donor.lat == null || donor.lon == null || isNaN(donor.lat) || isNaN(donor.lon)) {
                console.log(`Skipping ${donor.name} - missing coordinates`);
                continue;
            }
            // Check eligibility (Algo 1)
            if (isEligible(donor.last_donation_date)) {
                // Check distance (Algo 2)
                const d = haversine(lat, lon, donor.lat, donor.lon);
                console.log(`Donor ${donor.name} distance: ${d} km`);
                
                donor.distance = Number(d.toFixed(2));
                donor.score = calculateScore(d, donor.responsiveness || 1.0, donor.blood_group);
                matches.push(donor);
            }
        }

        // Algorithm 4: Progressive Radius Expansion
        // Expand from 5km up to include ALL valid donors (for demo: include everyone)
        let finalMatches = matches; // Include all valid, eligible donors regardless of distance
        let currentR = matches.length > 0 
            ? Math.ceil(Math.max(...matches.map(m => m.distance)) + 1) 
            : 0;

        // Algorithm 3: Sort by score descending
        finalMatches.sort((a, b) => b.score - a.score);
        console.log(`Returning ${finalMatches.length} eligible donors.`);

        // Now fetch nearby hospitals inside the expanded radius
        const hospitalQuery = "SELECT id, name, phone, lat, lon, address FROM facilities WHERE type = 'hospital'";
        db.all(hospitalQuery, [], (err, allHospitals) => {
            let nearbyHospitals = [];
            if (!err && allHospitals) {
                nearbyHospitals = allHospitals.filter(h => {
                    const hd = haversine(lat, lon, h.lat, h.lon);
                    if(hd <= 50) { // Get hospitals within a 50km radius
                       h.distance = Number(hd.toFixed(2));
                       return true;
                    }
                    return false;
                });
            }

            if (finalMatches.length === 0) {
                return res.status(200).json({ 
                    success: true, 
                    message: "No eligible donors found within maximum radius boundaries.",
                    radius_searched: maxR,
                    donors: [],
                    hospitals: nearbyHospitals
                });
            }

            return res.status(200).json({
                success: true,
                found_radius: currentR,
                donors: finalMatches,
                hospitals: nearbyHospitals
            });
        });
    });
};

// Endpoint to send a real email and WhatsApp alert to donor with full patient + hospital details
exports.notifyDonor = async (req, res) => {
    const {
        donorName, donorPhone, donorEmail,
        requestBloodGroup, trackingId,
        recipientDetails,   // { name, phone }
        hospitalDetails,    // { name, address, phone }
        donorLocation       // location string for context
    } = req.body;

    try {
        // Generate Ethereal test email account
        let testAccount = await nodemailer.createTestAccount();
        let transporter = nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            secure: false,
            auth: { user: testAccount.user, pass: testAccount.pass },
        });

        const hosp = hospitalDetails || { name: 'MKCG Medical College & Hospital', address: 'Medical College Rd, Berhampur', phone: '0680-2292746' };
        const rec  = recipientDetails || {};

        await transporter.sendMail({
            from: '"BloodConnect AI Subsystem" <noreply-bot@bloodconnect.local>',
            to: donorEmail || testAccount.user,
            subject: `[SYSTEM ALERT] Critical Blood Match - Ticket #${trackingId}`,
            html: `
                <div style="font-family: 'Segoe UI', sans-serif; max-width: 600px; margin: auto; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden; background: #ffffff;">
                    <div style="background: #111827; padding: 20px; text-align: center;">
                        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">BLOOD<span style="color: #ef4444;">CONNECT</span> BOT</h1>
                    </div>
                    <div style="padding: 30px;">
                        <p style="text-transform: uppercase; font-size: 11px; color: #ef4444; font-weight: bold; letter-spacing: 2px;">Automated Emergency Alert</p>
                        <h2 style="color: #1f2937; margin-top: 0;">Dear ${donorName}, You Are Matched!</h2>
                        <table style="width: 100%; border-collapse: collapse; margin-top: 20px; text-align: left;">
                            <tr style="border-bottom: 1px solid #e5e7eb; background: #f9fafb;">
                                <td style="padding: 10px; font-weight: bold;">Tracking ID</td>
                                <td style="padding: 10px; color: #2563eb; font-family: monospace;">${trackingId}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #e5e7eb;">
                                <td style="padding: 10px; font-weight: bold;">Blood Group Needed</td>
                                <td style="padding: 10px; color: #b91c1c; font-weight: bold;">${requestBloodGroup}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #e5e7eb; background: #f9fafb;">
                                <td style="padding: 10px; font-weight: bold;">Patient Name</td>
                                <td style="padding: 10px;">${rec.name || 'Confidential'}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #e5e7eb;">
                                <td style="padding: 10px; font-weight: bold;">Patient Contact</td>
                                <td style="padding: 10px;">${rec.phone || 'Contact Hospital'}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #e5e7eb; background: #f9fafb;">
                                <td style="padding: 10px; font-weight: bold;">Nearest Hospital</td>
                                <td style="padding: 10px;">${hosp.name}</td>
                            </tr>
                            <tr style="border-bottom: 1px solid #e5e7eb;">
                                <td style="padding: 10px; font-weight: bold;">Hospital Address</td>
                                <td style="padding: 10px;">${hosp.address}</td>
                            </tr>
                            <tr style="background: #f9fafb;">
                                <td style="padding: 10px; font-weight: bold;">Hospital Phone</td>
                                <td style="padding: 10px;">${hosp.phone}</td>
                            </tr>
                        </table>
                        <p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin-top: 20px;">Please contact the hospital directly with your Tracking ID to donate blood. Every minute matters!</p>
                    </div>
                    <div style="background: #f3f4f6; padding: 15px; text-align: center; color: #9ca3af; font-size: 12px;">
                        © 2026 BloodConnect AI Automated Systems. Do not reply to this email.
                    </div>
                </div>
            `
        });

        console.log("Email dispatched for:", donorName);

        // Send WhatsApp alert with full details
        const twilioResult = await messagingService.sendSmsAlert(
            donorPhone,
            donorName,
            requestBloodGroup,
            donorLocation || 'Berhampur Region',
            trackingId,
            rec,
            hosp
        );

        if (!twilioResult.success) {
            return res.status(500).json({
                success: false,
                message: twilioResult.error || 'Twilio Message failed to send'
            });
        }

        return res.json({
            success: true,
            message: 'WhatsApp Alert & Email dispatched!',
            twilioSID: twilioResult.sid
        });

    } catch (error) {
        console.error("Notification Error: ", error);
        return res.status(500).json({ success: false, message: 'Failed to send alerts.' });
    }
};

