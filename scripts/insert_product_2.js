const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database', 'kirtasiye.db');
const db = new sqlite3.Database(dbPath);

const product = {
    ad: "Herschel Retreat 15/16 İnç Uyumlu Büyük Boy Bordo Sırt Çantası",
    kategori: "Çanta",
    fiyat: 5599.00,
    stok: 10,
    aciklama: "Herschel Retreat 15/16 inç uyumlu bordo sırt çantası; %100 geri dönüştürülmüş EcoSystem kumaşı, 23L geniş hacmi ve ergonomik taşıma sistemiyle laptop ve günlük eşyalar için şık, dayanıklı ve konforlu bir kullanım sunar.",
    resim: "herschel_bordeaux.jpeg"
};

db.run(`INSERT INTO urunler (ad, kategori, fiyat, stok, aciklama, resim) VALUES (?, ?, ?, ?, ?, ?)`,
    [product.ad, product.kategori, product.fiyat, product.stok, product.aciklama, product.resim],
    function (err) {
        if (err) {
            console.error(err.message);
        } else {
            console.log(`Product added with ID: ${this.lastID}`);
        }
        db.close();
    }
);
