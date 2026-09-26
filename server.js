'use strict';

require('dotenv').config({ path: '.env.local' });
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const handler = require('./api/rpc');

const root = path.resolve(__dirname, 'public');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.ico': 'image/x-icon' };
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/api/rpc') {
    if (req.method === 'POST') {
      let body = '';
      for await (const chunk of req) {
        body += chunk;
        if (body.length > 5_000_000) { res.statusCode = 413; res.end('Request too large'); return; }
      }
      try { req.body = JSON.parse(body); } catch { req.body = null; }
    }
    return handler(req, res);
  }
  const target = path.resolve(root, '.' + decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname));
  if (!target.startsWith(root + path.sep)) { res.statusCode = 403; return res.end('Forbidden'); }
  fs.readFile(target, (error, contents) => {
    if (error) { res.statusCode = 404; return res.end('Not found'); }
    res.setHeader('Content-Type', types[path.extname(target)] || 'application/octet-stream');
    res.end(contents);
  });
});

const port = Number(process.env.PORT || 3000);
server.listen(port, () => console.log(`TracNghiem web: http://localhost:${port}`));
