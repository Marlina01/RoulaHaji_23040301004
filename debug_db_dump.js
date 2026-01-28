const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const dbPath = path.join(__dirname, 'database', 'kirtasiye.db');
const db = new sqlite3.Database(dbPath);

db.all('SELECT * FROM urunler', (err, rows) => {
    if (err) {
        console.error(err);
        return;
    }
    fs.writeFileSync('debug_products.json', JSON.stringify(rows, null, 2));
    console.log(`Dumped ${rows.length} products to debug_products.json`);
});
