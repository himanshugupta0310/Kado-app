const http = require('http');
const fs = require('fs');
const path = require('path');

function loadEnv(file) {
  try {
    return Object.fromEntries(
      fs.readFileSync(file, 'utf8')
        .split('\n')
        .filter(l => l.trim() && !l.startsWith('#'))
        .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
        .filter(([k]) => k)
    );
  } catch { return {}; }
}

const env = loadEnv(path.join(__dirname, '.env'));
const PORT = parseInt(env.DEV_SERVER_PORT || '3000', 10);
const BACKEND_PORT = env.BACKEND_PORT || '3001';
const API_URL = `http://localhost:${BACKEND_PORT}`;

const MIME = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.pdf': 'application/pdf',
};

http.createServer((req, res) => {
  const url = req.url.split('?')[0];

  if (url === '/env.js') {
    res.writeHead(200, { 'Content-Type': 'application/javascript' });
    res.end(`window.__KADO_API__ = ${JSON.stringify(API_URL)};`);
    return;
  }

  let filePath = path.join(__dirname, url === '/' ? 'index.html' : url);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); res.end('Not found'); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'text/plain' });
    res.end(data);
  });
}).listen(PORT, () => {
  console.log(`[frontend] http://localhost:${PORT}  →  API: ${API_URL}`);
});
