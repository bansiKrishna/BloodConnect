const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const matchRoutes = require('./routes/matchRoutes');
const db = require('./database/db'); // ensure DB init runs

const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json()); // parse JSON requests
app.use(express.urlencoded({ extended: true }));

// Serve frontend assets
app.use(express.static(path.join(__dirname, '../client')));
app.use('/uploads', express.static(process.env.RENDER ? '/tmp/uploads' : path.join(__dirname, 'uploads')));

// Redirect root to home.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/home.html'));
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/match', matchRoutes);
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/webhook', require('./routes/webhookRoutes'));

app.use((err, req, res, next) => {
    if (err && err.message) {
        return res.status(400).json({ error: err.message });
    }
    next(err);
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'BloodBank Backend is running' });
});

// Default route for API
app.get('/api', (req, res) => {
    res.send('Welcome to BloodConnect API');
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
