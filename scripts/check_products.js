const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../database/kirtasiye.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.all("SELECT count(*) as count FROM urunler", (err, rows) => {
        if (err) {
            console.error(err);
            return;
        }
        console.log("Product Count:", rows[0].count);
    });

    db.all("SELECT * FROM urunler LIMIT 5", (err, rows) => {
        console.log("Sample Products:", rows);
    });
});

db.close();
