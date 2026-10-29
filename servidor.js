// Servidor local do site oficial Osten. Uso: node servidor.js  (abre em http://localhost:5180)
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORTA = process.env.PORT || 5180;
const RAIZ = __dirname;
const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon'
};

http.createServer((req, res) => {
  let rota = decodeURIComponent(req.url.split('?')[0]);
  if (rota === '/') rota = '/index.html';
  const arquivo = path.normalize(path.join(RAIZ, rota));
  if (!arquivo.startsWith(RAIZ)) { res.writeHead(403); return res.end(); }
  fs.readFile(arquivo, (erro, dados) => {
    if (erro) { res.writeHead(404); return res.end('Não encontrado'); }
    res.writeHead(200, { 'Content-Type': TIPOS[path.extname(arquivo).toLowerCase()] || 'application/octet-stream' });
    res.end(dados);
  });
}).listen(PORTA, () => console.log('Site oficial Osten em http://localhost:' + PORTA));
