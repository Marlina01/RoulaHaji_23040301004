PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS urunler (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ad TEXT NOT NULL,
  kategori TEXT NOT NULL,
  fiyat REAL NOT NULL,
  stok INTEGER NOT NULL,
  aciklama TEXT,
  resim TEXT
);

CREATE TABLE IF NOT EXISTS siparisler (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ad_soyad TEXT NOT NULL,
  telefon TEXT NOT NULL,
  email TEXT NOT NULL,
  adres TEXT NOT NULL,
  odeme_tipi TEXT NOT NULL,
  toplam_tutar REAL NOT NULL,
  tarih DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS siparis_urunler (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  siparis_id INTEGER NOT NULL,
  urun_id INTEGER NOT NULL,
  adet INTEGER NOT NULL,
  birim_fiyat REAL NOT NULL,
  FOREIGN KEY(siparis_id) REFERENCES siparisler(id) ON DELETE CASCADE,
  FOREIGN KEY(urun_id) REFERENCES urunler(id)
);

CREATE TABLE IF NOT EXISTS kullanicilar (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ad_soyad TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  sifre TEXT NOT NULL,
  telefon TEXT,
  adres TEXT,
  tarih DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS adminler (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  kullanici_adi TEXT NOT NULL UNIQUE,
  sifre TEXT NOT NULL
);

INSERT OR IGNORE INTO adminler (kullanici_adi, sifre)
VALUES ('admin', 'c46314ad772115d62128e0d993ece1eb:968f121e90b8fde5fc6353fa41fd0b03edb99144ac9d31154563a43fa484b3d75c2e5b72e50570ecec58');

-- Örnek ürünler (resim yoksa placeholder.svg kullan)
DELETE FROM urunler;

INSERT INTO urunler (ad, kategori, fiyat, stok, aciklama, resim) VALUES
('Spiral Defter A4', 'Defter', 79.90, 45, 'A4 spiral defter, çizgili. Okul ve ofis için ideal.', 'placeholder.svg'),
('Tükenmez Kalem 0.7', 'Kalem', 19.90, 120, 'Akıcı yazım, 0.7 uç kalınlığı.', 'placeholder.svg'),
('Fosforlu Kalem Seti', 'Kalem', 99.90, 30, '5li fosforlu kalem seti, canlı renkler.', 'placeholder.svg'),
('Makas Paslanmaz', 'Ofis', 59.90, 25, 'Paslanmaz çelik, ergonomik tutuş.', 'placeholder.svg'),
('Zımba Makinesi', 'Ofis', 149.90, 18, 'Sağlam gövde, 24/6 zımba uyumlu.', 'placeholder.svg'),
('Klasör Dosya', 'Dosyalama', 39.90, 60, 'Dayanıklı klasör, etiketlikli.', 'placeholder.svg');
