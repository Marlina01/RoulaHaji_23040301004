const https = require('https');
const url = "https://www.istekle.com/herschel-retreat-13-14-inc-uyumlu-kucuk-boy-pembe-sirt-cantasi";

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        // Robust Image Extraction
        const ogImage = data.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
        const twitterImage = data.match(/<meta\s+name="twitter:image"\s+content="([^"]+)"/i);
        const anyJpg = data.match(/https:\/\/[^"]+\.jpg/i);

        console.log("OG Image:", ogImage ? ogImage[1] : "NULL");
        console.log("Tw Image:", twitterImage ? twitterImage[1] : "NULL");
        console.log("Any JPG:", anyJpg ? anyJpg[0] : "NULL");

        // Price
        const price = data.match(/1\.500\s*TL/);
        console.log("Confirmed Price:", price ? "1500" : "Unconfirmed");
    });
}).on('error', (err) => {
    console.error("Error:", err.message);
});
