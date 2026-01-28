const fs = require('fs');
const path = require('path');

const fileName = process.argv[2];
if (!fileName) {
    console.error("Please provide a filename");
    process.exit(1);
}

const html = fs.readFileSync(path.join(__dirname, '..', fileName), 'utf8');

// Regex Extractors
const titleMatch = html.match(/<meta property="og:title" content="(.*?)"/);
const imageMatch = html.match(/<meta property="og:image" content="(.*?)"/);
const descMatch = html.match(/<meta property="og:description" content="([^"]*?)"/m); // multiline might tricky
const priceMatch = html.match(/"price":\s*"(\d+(\.\d+)?)"/) || html.match(/class="price-value-\d+">\s*([\d.,]+)\s*TL/);


const result = {
    title: titleMatch ? titleMatch[1] : null,
    image: imageMatch ? imageMatch[1] : null,
    description: descMatch ? descMatch[1].replace(/\n/g, ' ').trim() : null,
    price: priceMatch ? (priceMatch[1] || priceMatch[0]).replace('TL', '').trim() : null
};

// Clean up price (remove dots/commas format to number if needed, but for now just string)
// Turkish currency usually 1.500,00 -> we need to be careful. 
// The JSON-LD usually has "price": "4999.00" which is safe.
// The HTML span has 4.999,00 TL.

console.log(JSON.stringify(result, null, 2));
