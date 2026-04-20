# 🩸 Smart Blood Donation & Emergency Finder System

**Presented By: (Group-11)**
* Prabin Kumar Sahu (2301109289)
* S Subham Pradhan (2301109307)
* Rakesh Kumar Sahoo (2301109167)
* S BansiKrishna Achary (2301109171)
* Raghunath Behera (2301109161)

**Mentored By:**
* Dr. Rashmi Ranjan Sahoo
* Mrs. Diptimayee Sahu

---

## 🚨 Problem Statement
In medical emergencies, the lack of a centralized system to quickly identify and contact suitable blood donors or nearby blood banks causes critical delays in blood availability. Existing manual methods are slow and unreliable, increasing health risks. The Blood Donation and Emergency Finder System addresses this issue by enabling fast, accurate, and location-based blood search during emergencies.

---

## 🎯 Objectives
* To design and develop a simple and user-friendly Blood Donation Management System.
* To help users find required blood groups quickly during emergencies.
* To provide accurate information about blood donors and blood banks in one centralized place.
* To allow users to search blood availability based on specific blood groups.
* To reduce time wastage by providing fast, location-based, and efficient blood searching.
* To enable hospitals to search for blood for patients seamlessly.
* To allow users to request enrollment as blood donors through the system.
* To manage blood bank and blood group data using separate databases for security.
* To store and retrieve data efficiently using DBMS concepts.
* To ensure the system is easy to use, highly reliable, and efficient for all stakeholders.

---

## ⚙️ Core Requirements & Features

| Feature | Description |
| :--- | :--- |
| **Donor Registration** | Register and manage profile (blood group, GPS location, last donation date). |
| **Eligibility Check** | Auto-filter donors based on a mandatory 90-day donation gap. |
| **Emergency Requests** | Hospitals generate requests specifying blood group, location, and urgency. |
| **Geo-Search** | Locate eligible donors within a configurable radius (starting at 5km). |
| **Intelligent Ranking** | Rank donors by distance, responsiveness, and blood type rarity. |
| **Alert Broadcast** | Send sequential push/SMS alerts to ranked donors until fulfilled. |
| **Response Handling** | Process donor accept/decline actions; route ETA and contact to hospitals. |
| **Hospital Dashboard** | Monitor active requests, donor ETAs, and blood inventory in real-time. |
| **Donation Confirmation**| Auto-update donor eligibility dates and hospital stock post-donation. |
| **Inventory Management**| Allow blood banks to adjust stock levels and view hospital requests. |
| **Central Integration** | *(Optional)* Sync hospital stock updates with a central blood bank database. |
| **Audit Logging** | Track all system actions, timestamps, and user IDs for compliance. |

---

## 💻 Tech Stack
* **Frontend:** HTML5, CSS3, JavaScript, Tailwind CSS, CDN integration.
* **Backend:** Node.js, Express.js.
* **Database:** SQLite3 (Efficient data storage using core DBMS concepts).
* **APIs & Services:** * Geo-Spatial Location Services
  * Vonage API & Twilio API (SMS / Call alerts)
  * Nodemailer (Email notifications)
  * Ngrok (Secure tunneling)
* **Deployment:**
  * Frontend: **Firebase**
  * Backend: **Render**

---

## 🗺️ System Modules & Page Flow

### 1. 🏠 Home Page (`home.html`)
The landing page with clear navigation portals to all dedicated services (Admin, Hospital, Donor).

### 2. 🩸 Donor Portal (`register-donor.html` & `donor-dashboard.html`)
* **Registration:** Users fill out a form with their blood group, phone number, Aadhaar number, and upload their Aadhaar file for secure KYC.
* **Dashboard:** Donors can view their profile, active blood group status, and verification status. 

### 3. 🏥 Hospital Portal (`login.html` → `hospital-dashboard.html`)
* **Role-Based Login:** Access secured for verified hospitals.
* **Request Blood (`request-blood.html`):** Hospitals enter the required blood group. Browser geolocation auto-fills Lat/Lon coordinates to immediately display ranked local donors and nearby hospitals.
* **Authentication:** Valid authentication for public blood requests and direct hospital blood requests.

### 4. ⚙️ Admin Portal (`login.html` → `admin-dashboard.html`)
* **Management:** View pending KYC verifications and approve donor registrations.

### 5. 📡 Notification & Tracking Flow
* **Notify Donor:** Hospitals click "Notify" on a matched donor card. The system dispatches an SMS + Email and generates a tracking ID.
* **Track Request (`track-request.html`):** Users enter the tracking ID and donor phone number to poll the webhook status, displaying real-time responses: `YES / NO / Pending`.

---

## 📸 UI Gallery / Screenshots
*(Upload your project screenshots in this section)*

### 🏠 Home Page
![Home Page Placeholder](https://via.placeholder.com/800x400?text=Home+Page+Screenshot)
> *Description: Landing page and primary navigation portal.*

### ⚙️ Admin Dashboard
![Admin Dashboard Placeholder](https://via.placeholder.com/800x400?text=Admin+Dashboard+Screenshot)
> *Description: Admin view for verifying donor KYC and managing system users.*

### 🏥 Hospital Services & Request Portal
![Hospital Dashboard Placeholder](https://via.placeholder.com/800x400?text=Hospital+Dashboard+Screenshot)
> *Description: Hospital dashboard showing inventory, nearby donors, and the blood request interface.*

### 🩸 Donor Profile & Registration
![Donor Portal Placeholder](https://via.placeholder.com/800x400?text=Donor+Registration+Screenshot)
> *Description: Donor KYC registration, eligibility tracking, and personalized dashboard.*

---

## 📝 Conclusion
The **Blood Donation and Emergency Finder System** provides an effective and reliable solution to the major challenges faced during medical emergencies, especially in finding blood quickly. By creating a centralized platform, the system ensures that information about donors and blood availability is easily accessible, reducing the time and effort required during critical situations. This makes the process faster and more efficient compared to traditional methods.

The system integrates advanced features such as real-time donor status, GPS-based search, blood bank data, and instant emergency alerts. These features help in quickly locating suitable donors and nearby blood banks, significantly reducing delays and increasing the chances of saving lives during emergencies.

---

## 🚀 Future Scope
* **Enhanced Security:** Implement password hashing, JWT authentication, and OTP-based secure logins.
* **Instant Messaging Integration:** Integrate WhatsApp/SMS notifications for more immediate, accessible alerts.
* **Mobile Application:** Develop a dedicated mobile app for easier access, push notifications, and a better user experience.
* **AI/ML Integration:** Use machine learning algorithms to predict demand, improve donor matching, and analyze responsiveness.
* **Live Maps:** Add real-time map features with live routing to locate donors and hospitals quickly.
* **Database Scaling:** Upgrade the database to PostgreSQL for enhanced scalability and performance under heavy load.
* **Advanced Analytics:** Implement an admin analytics dashboard for monitoring blood donation trends and regional demand.
* **Geographical Expansion:** Scale the system from a local-level pilot to full state and national-level coverage.
README.md
Displaying README.md.
