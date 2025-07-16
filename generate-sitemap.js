// generate-sitemap.js
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://saheef.in';
const OUTPUT_FILE = 'sitemap.xml';

function getHtmlFiles(dir, basePath = '') {
  const results = [];
  const list = fs.readdirSync(dir);

  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const relPath = path.join(basePath, file);

    if (fs.statSync(fullPath).isDirectory()) {
      results.push(...getHtmlFiles(fullPath, path.join(basePath, file)));
    } else if (file.endsWith('.html')) {
      results.push(relPath.replace(/\\/g, '/')); // Normalize for Windows
    }
  });

  return results;
}

function buildSitemap(urls) {
  const header = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
  const footer = `</urlset>`;
  const body = urls.map(url => `  <url>\n    <loc>${BASE_URL}/${url}</loc>\n  </url>`).join('\n');
  return header + body + '\n' + footer;
}

const htmlFiles = getHtmlFiles('.');
const filtered = htmlFiles.filter(file => !file.startsWith('.git') && !file.includes('404') && !file.startsWith('node_modules'));

const sitemap = buildSitemap(filtered);
fs.writeFileSync(OUTPUT_FILE, sitemap);

console.log('✅ sitemap.xml generated with', filtered.length, 'URLs');
