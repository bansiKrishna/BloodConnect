const db = require('./db');   // ✅ FIRST define db

const donors = [
{
name: "Rahul Patnaik",
email: "rahul.patnaik01@gmail.com",
phone: "9123456701",
blood_group: "A+",
location: "Berhampur",
address: "Gosaninuagaon",
lat: 19.3148,
lon: 84.7942
},
{
name: "Sasmita Das",
email: "sasmita.das02@gmail.com",
phone: "9123456702",
blood_group: "B+",
location: "Berhampur",
address: "Courtpeta",
lat: 19.3055,
lon: 84.7898
},
{
name: "Bikash Nayak",
email: "bikash.nayak03@gmail.com",
phone: "9123456703",
blood_group: "O+",
location: "Berhampur",
address: "Khodasingi",
lat: 19.3212,
lon: 84.8010
},
{
name: "Priyanka Sahu",
email: "priyanka.sahu04@gmail.com",
phone: "9123456704",
blood_group: "AB+",
location: "Berhampur",
address: "Brahmapur University Area",
lat: 19.3165,
lon: 84.8260
},
{
name: "Amit Kumar Behera",
email: "amit.behera05@gmail.com",
phone: "9123456705",
blood_group: "A-",
location: "Berhampur",
address: "Ankuli",
lat: 19.3301,
lon: 84.8105
},
{
name: "Sneha Mohanty",
email: "sneha.mohanty06@gmail.com",
phone: "9123456706",
blood_group: "B-",
location: "Berhampur",
address: "Haladiapadar",
lat: 19.3090,
lon: 84.8123
},
{
name: "Deepak Rout",
email: "deepak.rout07@gmail.com",
phone: "9123456707",
blood_group: "O-",
location: "Berhampur",
address: "Engineering School Road",
lat: 19.3120,
lon: 84.7988
},
{
name: "Ananya Panda",
email: "ananya.panda08@gmail.com",
phone: "9123456708",
blood_group: "AB-",
location: "Berhampur",
address: "Gate Bazaar",
lat: 19.3135,
lon: 84.7910
},
{
name: "Rakesh Pradhan",
email: "rakesh.pradhan09@gmail.com",
phone: "9123456709",
blood_group: "A+",
location: "Berhampur",
address: "Lanjipalli",
lat: 19.2950,
lon: 84.7850
},
{
name: "Pooja Jena",
email: "pooja.jena10@gmail.com",
phone: "9123456710",
blood_group: "B+",
location: "Berhampur",
address: "Prem Nagar",
lat: 19.3078,
lon: 84.7975
},
{
name: "Subham Swain",
email: "subham.swain11@gmail.com",
phone: "9123456711",
blood_group: "O+",
location: "Berhampur",
address: "Gopalpur Road",
lat: 19.2800,
lon: 84.7800
},
{
name: "Niharika Patro",
email: "niharika.patro12@gmail.com",
phone: "9123456712",
blood_group: "AB+",
location: "Berhampur",
address: "Gandhi Nagar",
lat: 19.3115,
lon: 84.7933
},
{
name: "Suraj Mishra",
email: "suraj.mishra13@gmail.com",
phone: "9123456713",
blood_group: "A-",
location: "Berhampur",
address: "Aska Road",
lat: 19.3002,
lon: 84.7700
},
{
name: "Rituparna Kar",
email: "ritu.kar14@gmail.com",
phone: "9123456714",
blood_group: "B-",
location: "Berhampur",
address: "Tata Benz Square",
lat: 19.3180,
lon: 84.8055
},
{
name: "Abhishek Das",
email: "abhishek.das15@gmail.com",
phone: "9123456715",
blood_group: "O-",
location: "Berhampur",
address: "Ambapua",
lat: 19.3400,
lon: 84.8200
},
{
name: "Sweta Bisoyi",
email: "sweta.bisoyi16@gmail.com",
phone: "9123456716",
blood_group: "AB-",
location: "Berhampur",
address: "Lochapada",
lat: 19.3250,
lon: 84.8150
},
{
name: "Manoj Gouda",
email: "manoj.gouda17@gmail.com",
phone: "9123456717",
blood_group: "A+",
location: "Berhampur",
address: "Digapahandi Road",
lat: 19.2900,
lon: 84.7600
},
{
name: "Ipsita Rath",
email: "ipsita.rath18@gmail.com",
phone: "9123456718",
blood_group: "B+",
location: "Berhampur",
address: "Konisi",
lat: 19.3500,
lon: 84.8300
},
{
name: "Debasis Panigrahi",
email: "debasis.pani19@gmail.com",
phone: "9123456719",
blood_group: "O+",
location: "Berhampur",
address: "Narayanpur",
lat: 19.3600,
lon: 84.8400
},
{
name: "Tanmay Padhy",
email: "tanmay.padhy20@gmail.com",
phone: "9123456720",
blood_group: "AB+",
location: "Berhampur",
address: "Bijipur",
lat: 19.3150,
lon: 84.7999
}
];
db.serialize(() => {

    // 🧹 Step 1: Clear old data
    db.run("DELETE FROM donors", (err) => {
        if (err) {
            console.log("❌ Error clearing table:", err.message);
        } else {
            console.log("🧹 Old data cleared");
        }

        // 🚀 Step 2: Insert new data
        donors.forEach(d => {
            db.run(`
                INSERT INTO donors 
                (name, email, phone, blood_group, location, address, lat, lon, password)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                d.name,
                d.email,
                d.phone,
                d.blood_group,
                d.location,
                d.address,
                d.lat,
                d.lon,
                "123456"
            ], function(err) {
                if (err) {
                    console.log("❌ Error inserting", d.email, "->", err.message);
                } else {
                    console.log("✅ Inserted:", d.name);
                }
            });
        });

        // 📊 Step 3: Final count (slight delay to ensure inserts finish)
        setTimeout(() => {
            db.all("SELECT COUNT(*) as total FROM donors", [], (err, rows) => {
                if (err) {
                    console.log("❌ Count error:", err.message);
                } else {
                    console.log("📊 Total donors in DB:", rows[0].total);
                }
            });
        }, 500);

    });

});