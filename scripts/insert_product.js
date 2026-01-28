const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'database', 'kirtasiye.db');
const db = new sqlite3.Database(dbPath);

const product = {
    ad: "Herschel Retreat 13/14 İnç Uyumlu Küçük Boy Pembe Sırt Çantası",
    kategori: "Çanta",
    fiyat: 4999.00,
    stok: 10,
    aciklama: "Herschel Retreat 13/14 inç uyumlu pembe sırt çantası; %100 geri dönüştürülmüş EcoSystem kumaşı, 17L ideal kapasitesi ve ergonomik tasarımıyla günlük kullanımda laptop ve kişisel eşyalarınız için şık ve konforlu bir taşıma çözümü sunar.",
    resim: "herschel_pink.jpeg"
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
