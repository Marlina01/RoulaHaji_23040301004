const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const db = new sqlite3.Database('./database/kirtasiye.db');

db.all('SELECT id, ad, resim FROM urunler', (err, rows) => {
    if (err) {
        console.error(err);
        return;
    }
    fs.writeFileSync('db_dump.txt', JSON.stringify(rows, null, 2));
    console.log('Done');
});
