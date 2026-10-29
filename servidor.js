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
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4'
};

http.createServer((req, res) => {
  let rota = decodeURIComponent(req.url.split('?')[0]);
  if (rota === '/') rota = '/index.html';
  const arquivo = path.normalize(path.join(RAIZ, rota));
  if (!arquivo.startsWith(RAIZ)) { res.writeHead(403); return res.end(); }
  fs.stat(arquivo, (erro, info) => {
    if (erro || !info.isFile()) { res.writeHead(404); return res.end('Não encontrado'); }
    const tipo = TIPOS[path.extname(arquivo).toLowerCase()] || 'application/octet-stream';
    // Vídeo precisa de "range" para o navegador tocar e repetir em loop
    const range = req.headers.range && /bytes=(\d*)-(\d*)/.exec(req.headers.range);
    if (range) {
      const inicio = range[1] ? parseInt(range[1], 10) : 0;
      const fim = range[2] ? parseInt(range[2], 10) : info.size - 1;
      res.writeHead(206, {
        'Content-Type': tipo,
        'Content-Range': `bytes ${inicio}-${fim}/${info.size}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': fim - inicio + 1
      });
      return fs.createReadStream(arquivo, { start: inicio, end: fim }).pipe(res);
    }
    res.writeHead(200, { 'Content-Type': tipo, 'Content-Length': info.size, 'Accept-Ranges': 'bytes' });
    fs.createReadStream(arquivo).pipe(res);
  });
}).listen(PORTA, () => console.log('Site oficial Osten em http://localhost:' + PORTA));
