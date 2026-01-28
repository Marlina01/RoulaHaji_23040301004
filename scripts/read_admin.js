const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../database/kirtasiye.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.all("SELECT * FROM adminler", (err, rows) => {
        if (err) {
            console.error(err);
            return;
        }
        console.log("Admin Users in DB:");
        console.log(JSON.stringify(rows, null, 2));
    });
});

db.close();
