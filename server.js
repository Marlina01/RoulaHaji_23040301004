//server.js
const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Static klasörler
app.use(express.static(path.join(__dirname, "public")));
app.use("/css", express.static(path.join(__dirname, "css")));
app.use("/js", express.static(path.join(__dirname, "js")));
app.use("/components", express.static(path.join(__dirname, "components")));
app.use("/images", express.static(path.join(__dirname, "public", "images")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// --- GÜVENLİK ---
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function comparePassword(password, storedParam) {
  if (!storedParam || !storedParam.includes(":")) return false;
  const [salt, key] = storedParam.split(":");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return key === hash;
}

const dbDir = path.join(__dirname, "database");
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// DB bağlantısı + kurulum
const dbPath = path.join(__dirname, "database", "kirtasiye.db");
const sqlPath = path.join(__dirname, "database", "kurulum.sql");

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("DB HATASI:", err.message);
    return;
  }
  // DB dosyası yoksa KUR, varsa DOKUNMA
  if (!fs.existsSync(dbPath)) {
    try {
      const sql = fs.readFileSync(sqlPath, "utf8");
      db.exec(sql);
      console.log("SQLite ilk kez kuruldu");
    } catch (e) {
      console.error("SQL dosyası okunamadı:", e.message);
    }
  } else {
    console.log("SQLite mevcut, veriler korunuyor");
  }

  // Kullanıcılar tablosuna engelli kolonu ekle (Migration)
  db.all("PRAGMA table_info(kullanicilar)", (err, columns) => {
    if (err) return;
    const hasEngelli = columns.some(col => col.name === 'engelli');
    if (!hasEngelli) {
      db.run("ALTER TABLE kullanicilar ADD COLUMN engelli INTEGER DEFAULT 0", (err) => {
        if (err) console.error("Tablo guncelleme hatasi (kullanicilar):", err.message);
        else console.log("Tablo guncellendi: kullanicilar (engelli sutunu eklendi)");
      });
    }
  });

  // Mesajlar tablosunu oluştur (Eğer yoksa)
  db.run(`
    CREATE TABLE IF NOT EXISTS mesajlar (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ad_soyad TEXT NOT NULL,
      email TEXT NOT NULL,
      mesaj TEXT NOT NULL,
      tarih DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Siparişler tablosuna durum kolonu ekle (Migration)
  db.all("PRAGMA table_info(siparisler)", (err, rows) => {
    if (err) {
      console.error("Tablo bilgisi alınamadı:", err);
      return;
    }
    const hasDurum = rows.some(r => r.name === 'durum');
    if (!hasDurum) {
      db.run("ALTER TABLE siparisler ADD COLUMN durum TEXT DEFAULT 'Bekliyor'", (err) => {
        if (err) console.error("Durum kolonu eklenemedi:", err);
        else console.log("Siparişler tablosuna 'durum' kolonu eklendi.");
      });
    }
  });
});

// Admin Token
let adminToken = null;
function tokenUret() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
function adminKontrol(req, res, next) {
  const t = req.headers["x-admin-token"];
  if (!t || !adminToken || t !== adminToken) {
    return res.status(401).json({ hata: "Yetkisiz" });
  }
  next();
}

// Multer (Resim Yükleme)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/images");
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  }
});
fs.mkdirSync(path.join(__dirname, "public", "images"), { recursive: true });
const upload = multer({ storage });


// ---------- API: Ürünler ----------
app.get("/api/urunler", (req, res) => {
  const kategori = req.query.kategori;
  const arama = req.query.q;

  let sql = "SELECT * FROM urunler";
  const params = [];

  const kosullar = [];
  if (kategori) {
    kosullar.push("kategori = ?");
    params.push(kategori);
  }
  if (arama) {
    kosullar.push("(ad LIKE ? OR aciklama LIKE ?)");
    params.push(`%${arama}%`, `%${arama}%`);
  }
  if (kosullar.length) sql += " WHERE " + kosullar.join(" AND ");
  sql += " ORDER BY id DESC";

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ hata: err.message });
    res.json(rows);
  });
});

app.get("/api/urunler/:id", (req, res) => {
  db.get("SELECT * FROM urunler WHERE id = ?", [req.params.id], (err, row) => {
    if (err) return res.status(500).json({ hata: err.message });
    if (!row) return res.status(404).json({ hata: "Ürün bulunamadı" });
    res.json(row);
  });
});

app.get("/api/kategoriler", (req, res) => {
  db.all("SELECT DISTINCT kategori FROM urunler ORDER BY kategori", [], (err, rows) => {
    if (err) return res.status(500).json({ hata: err.message });
    res.json(rows.map(r => r.kategori));
  });
});

// ---------- API: Sipariş ----------
app.post("/api/siparis", (req, res) => {
  const { ad_soyad, telefon, email, adres, odeme_tipi, sepet } = req.body;

  if (!ad_soyad || !telefon || !email || !adres || !odeme_tipi) {
    return res.status(400).json({ hata: "Eksik bilgi" });
  }
  if (!Array.isArray(sepet) || sepet.length === 0) {
    return res.status(400).json({ hata: "Sepet boş" });
  }

  // toplam hesapla
  let toplam = 0;
  for (const u of sepet) {
    toplam += Number(u.fiyat) * Number(u.adet);
  }

  const insertSiparis = `
    INSERT INTO siparisler (ad_soyad, telefon, email, adres, odeme_tipi, toplam_tutar, durum)
    VALUES (?, ?, ?, ?, ?, ?, 'Bekliyor')
  `;

  db.run(insertSiparis, [ad_soyad, telefon, email, adres, odeme_tipi, toplam], function (err) {
    if (err) return res.status(500).json({ hata: err.message });

    const siparisId = this.lastID;
    const stmt = db.prepare(`
      INSERT INTO siparis_urunler (siparis_id, urun_id, adet, birim_fiyat)
      VALUES (?, ?, ?, ?)
    `);

    for (const u of sepet) {
      stmt.run([siparisId, u.id, u.adet, u.fiyat]);
    }
    stmt.finalize();
    res.json({ mesaj: "Sipariş oluşturuldu", siparis_id: siparisId });
  });
});

// ---------- API: İletişim ----------
app.post("/api/iletisim", (req, res) => {
  const { ad_soyad, email, mesaj } = req.body;
  if (!ad_soyad || !email || !mesaj) {
    return res.status(400).json({ hata: "Eksik bilgi" });
  }

  db.run(
    "INSERT INTO mesajlar (ad_soyad, email, mesaj) VALUES (?, ?, ?)",
    [ad_soyad, email, mesaj],
    function (err) {
      if (err) return res.status(500).json({ hata: err.message });
      res.json({ mesaj: "Mesaj alındı", id: this.lastID });
    }
  );
});

// ---------- Admin: Siparişleri Getir ----------
app.get("/api/admin/siparisler", adminKontrol, (req, res) => {
  db.all("SELECT * FROM siparisler ORDER BY tarih DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ hata: err.message });
    res.json(rows);
  });
});

// ---------- Admin: Sipariş Detay ----------
app.get("/api/admin/siparis/:id", adminKontrol, (req, res) => {
  const id = req.params.id;

  db.get("SELECT * FROM siparisler WHERE id = ?", [id], (err, siparis) => {
    if (err) return res.status(500).json({ hata: err.message });
    if (!siparis) return res.status(404).json({ hata: "Sipariş bulunamadı" });

    db.all(
      `SELECT su.*, u.ad as urun_ad, u.resim 
       FROM siparis_urunler su 
       LEFT JOIN urunler u ON su.urun_id = u.id 
       WHERE su.siparis_id = ?`,
      [id],
      (err, urunler) => {
        if (err) return res.status(500).json({ hata: err.message });
        res.json({ siparis, urunler });
      }
    );
  });
});

// ---------- Admin: Sipariş Sil ----------
app.delete("/api/admin/siparis/:id", adminKontrol, (req, res) => {
  db.run("DELETE FROM siparisler WHERE id = ?", [req.params.id], function (err) {
    if (err) return res.status(500).json({ hata: err.message });
    res.json({ mesaj: "Sipariş silindi" });
  });
});

// ---------- Admin: Sipariş Güncelle ----------
app.put("/api/admin/siparis/:id", adminKontrol, (req, res) => {
  const { ad_soyad, telefon, email, adres, durum } = req.body;

  let updates = [];
  let params = [];

  if (ad_soyad) { updates.push("ad_soyad=?"); params.push(ad_soyad); }
  if (telefon) { updates.push("telefon=?"); params.push(telefon); }
  if (email) { updates.push("email=?"); params.push(email); }
  if (adres) { updates.push("adres=?"); params.push(adres); }
  if (durum) { updates.push("durum=?"); params.push(durum); }

  params.push(req.params.id);

  if (updates.length === 0) {
    return res.json({ success: true, message: "Değişiklik yok" });
  }

  const sql = `UPDATE siparisler SET ${updates.join(", ")} WHERE id=?`;

  db.run(sql, params, function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true });
  }
  );
});

// Admin: Kullanıcıyı Engelle/Engeli Kaldır
app.put("/api/admin/kullanici/:id/engelle", adminKontrol, (req, res) => {
  const { engelli } = req.body; // 1 veya 0
  db.run("UPDATE kullanicilar SET engelli = ? WHERE id = ?", [engelli, req.params.id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true });
  });
});

// Admin: Kullanıcı Sil
app.delete("/api/admin/kullanici/:id", adminKontrol, (req, res) => {
  db.run("DELETE FROM kullanicilar WHERE id = ?", [req.params.id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true });
  });
});


// ---------- Admin: Kullanıcıları Getir ----------
app.get("/api/admin/kullanicilar", adminKontrol, (req, res) => {
  db.all("SELECT id, ad_soyad, email, telefon, adres, tarih FROM kullanicilar ORDER BY id DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ hata: err.message });
    res.json(rows);
  });
});

// ---------- Admin: Kullanıcı Güncelle ----------
app.put("/api/admin/kullanici/:id", adminKontrol, (req, res) => {
  const { ad_soyad, email, telefon, adres } = req.body;
  if (!ad_soyad || !email) return res.status(400).json({ hata: "Eksik bilgi" });

  db.run(
    "UPDATE kullanicilar SET ad_soyad=?, email=?, telefon=?, adres=? WHERE id=?",
    [ad_soyad, email, telefon, adres, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ hata: err.message });
      res.json({ mesaj: "Kullanıcı güncellendi" });
    }
  );
});

// ---------- Admin: Giriş (GÜVENLİ) ----------
app.post("/api/admin/giris", (req, res) => {
  let { kullanici_adi, kullaniciAdi, sifre } = req.body;
  kullanici_adi = kullanici_adi || kullaniciAdi; // Fallback for cached frontends

  if (!kullanici_adi || !sifre) return res.status(400).json({ hata: "Eksik bilgi" });

  db.get(
    "SELECT * FROM adminler WHERE kullanici_adi = ?",
    [kullanici_adi],
    (err, row) => {
      if (err) return res.status(500).json({ hata: err.message });

      if (!row) return res.status(401).json({ hata: "Hatalı giriş (User not found)" });

      // Şifre kontrolü
      let match = false;
      if (row.sifre.includes(":")) {
        match = comparePassword(sifre, row.sifre);
      } else {
        match = (row.sifre === sifre);
      }

      if (!match) return res.status(401).json({ hata: "Hatalı giriş (Password mismatch)" });

      adminToken = tokenUret();
      res.json({ mesaj: "Giriş başarılı", token: adminToken });
    }
  );
});

// ---------- Kullanıcı: Kayıt (GÜVENLİ) ----------
app.post("/api/kayit", (req, res) => {
  const { ad_soyad, email, sifre, telefon, adres } = req.body;
  if (!ad_soyad || !email || !sifre) return res.status(400).json({ hata: "Eksik bilgi" });

  const hashedSifre = hashPassword(sifre);

  db.run(
    "INSERT INTO kullanicilar (ad_soyad, email, sifre, telefon, adres) VALUES (?, ?, ?, ?, ?)",
    [ad_soyad, email, hashedSifre, telefon, adres],
    function (err) {
      if (err) {
        if (err.message.includes("UNIQUE")) return res.status(400).json({ hata: "Bu e-posta zaten kayıtlı" });
        return res.status(500).json({ hata: err.message });
      }
      res.json({ mesaj: "Kayıt başarılı", id: this.lastID });
    }
  );
});

// ---------- Kullanıcı: Giriş (GÜVENLİ) ----------
app.post("/api/giris", (req, res) => {
  const { email, sifre } = req.body;
  if (!email || !sifre) return res.status(400).json({ hata: "Eksik bilgi" });

  db.get(
    "SELECT * FROM kullanicilar WHERE email = ?",
    [email],
    (err, row) => {
      if (err) return res.status(500).json({ hata: err.message });
      if (!row) return res.status(401).json({ hata: "Hatalı e-posta veya şifre" });

      // Şifre kontrolü
      let match = false;
      if (row.sifre.includes(":")) {
        match = comparePassword(sifre, row.sifre);
      } else {
        match = (row.sifre === sifre);
      }

      if (!match) return res.status(401).json({ hata: "Hatalı e-posta veya şifre" });

      res.json({
        mesaj: "Giriş başarılı",
        kullanici: { id: row.id, ad_soyad: row.ad_soyad, email: row.email }
      });
    }
  );
});


// ---------- Admin: ürün CRUD ----------
app.post(
  "/api/admin/urun",
  adminKontrol,
  upload.single("resim"),
  (req, res) => {
    const { ad, kategori, fiyat, stok, aciklama } = req.body;
    const resim = req.file ? req.file.filename : "placeholder.svg";

    if (!ad || !kategori || fiyat == null || stok == null) {
      return res.status(400).json({ hata: "Eksik alan" });
    }

    db.run(
      `INSERT INTO urunler (ad, kategori, fiyat, stok, aciklama, resim)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [ad, kategori, fiyat, stok, aciklama || "", resim],
      function (err) {
        if (err) return res.status(500).json({ hata: err.message });
        res.json({ mesaj: "Ürün eklendi", id: this.lastID });
      }
    );
  }
);

app.put(
  "/api/admin/urun/:id",
  adminKontrol,
  upload.single("resim"),
  (req, res) => {
    const { ad, kategori, fiyat, stok, aciklama } = req.body;

    db.get("SELECT resim FROM urunler WHERE id = ?", [req.params.id], (err, row) => {
      if (err) return res.status(500).json({ hata: err.message });
      if (!row) return res.status(404).json({ hata: "Ürün bulunamadı" });

      const resim = req.file ? req.file.filename : row.resim;

      db.run(
        `UPDATE urunler
         SET ad=?, kategori=?, fiyat=?, stok=?, aciklama=?, resim=?
         WHERE id=?`,
        [ad, kategori, fiyat, stok, aciklama || "", resim, req.params.id],
        function (err) {
          if (err) return res.status(500).json({ hata: err.message });
          res.json({ mesaj: "Ürün güncellendi" });
        }
      );
    });
  }
);

app.delete("/api/admin/urun/:id", adminKontrol, (req, res) => {
  db.run("DELETE FROM urunler WHERE id = ?", [req.params.id], function (err) {
    if (err) return res.status(500).json({ hata: err.message });
    res.json({ mesaj: "Ürün silindi" });
  });
});

app.listen(PORT, () =>
  console.log(`Sunucu hazır → ${PORT}`)
);
