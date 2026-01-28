const https = require('https');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { execSync } = require('child_process');

const url = process.argv[2];
if (!url) {
    console.error("Usage: node scripts/auto_add_product.js <URL>");
    process.exit(1);
}

// Helper to download file
function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close(resolve);
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => reject(err));
        });
    });
}

// Fetch HTML
console.log(`Fetching: ${url}`);
https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', async () => {
        try {
            // 1. Parse Details
            const ogTitle = data.match(/<meta property="og:title" content="(.*?)"/);
            const ogImage = data.match(/<meta property="og:image" content="(.*?)"/);
            const ogDesc = data.match(/<meta property="og:description" content="([\S\s]*?)"/);

            // robust price scraping
            let price = '0';
            const jsonLdMatch = data.match(/"price":\s*"(\d+(\.\d+)?)"/);
            if (jsonLdMatch) {
                price = jsonLdMatch[1];
            } else {
                const regexPrice = data.match(/([\d.]+)\s*TL/);
                if (regexPrice) price = regexPrice[1].replace(/\./g, '').replace(',', '.'); // naive cleanup
            }

            const title = ogTitle ? ogTitle[1].replace(/&amp;/g, '&').replace(/&#x27;/g, "'") : "Unknown Product";
            const imageUrl = ogImage ? ogImage[1] : null;
            let description = ogDesc ? ogDesc[1].replace(/\n/g, ' ').replace(/\s+/g, ' ').trim() : "";

            // Basic Category logic based on keywords
            let category = "Kırtasiye"; // Default
            const titleLower = title.toLowerCase();
            if (titleLower.includes("çanta") || titleLower.includes("kılıf")) category = "Çanta";
            else if (titleLower.includes("kalem")) category = "Kalem";
            else if (titleLower.includes("defter") || titleLower.includes("blok")) category = "Defter";
            else if (titleLower.includes("boya")) category = "Boya";
            else if (titleLower.includes("dosya")) category = "Dosyalama";
            else if (titleLower.includes("cetvel") || titleLower.includes("silgi")) category = "Diğer";

            console.log(`Found: ${title} | ${price} TL | ${category}`);

            let imageFileName = "placeholder.svg";
            if (imageUrl) {
                const ext = path.extname(imageUrl) || '.jpg';
                const safeName = title.replace(/[^a-z0-9]/gi, '_').toLowerCase().substring(0, 50);
                imageFileName = `${safeName}_${Date.now()}${ext}`;
                const imagePath = path.join(__dirname, '..', 'public', 'images', imageFileName);

                console.log(`Downloading image: ${imageUrl} -> ${imageFileName}`);
                await downloadFile(imageUrl, imagePath);
            }

            // 2. Insert into DB
            const dbPath = path.join(__dirname, '..', 'database', 'kirtasiye.db');
            const db = new sqlite3.Database(dbPath);

            db.run(`INSERT INTO urunler (ad, kategori, fiyat, stok, aciklama, resim) VALUES (?, ?, ?, ?, ?, ?)`,
                [title, category, price, 20, description, imageFileName],
                function (err) {
                    if (err) console.error("DB Error:", err.message);
                    else console.log(`SUCCESS: Inserted with ID ${this.lastID}`);
                    db.close();
                }
            );

        } catch (e) {
            console.error("Processing Error:", e);
        }
    });

}).on('error', (e) => {
    console.error("Network Error:", e);
});
