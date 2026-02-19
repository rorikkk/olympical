#!/usr/bin/env node
/**
 * Local proxy server for planner-import.html
 *
 * Run:  node server.js
 * Open: http://localhost:8080/planner-import.html
 *
 * No npm install needed — uses only Node.js built-in modules.
 * Proxies POST /api/messages → https://api.anthropic.com/v1/messages
 */

const http  = require('http');
const https = require('https');
const fs    = require('fs');
const path  = require('path');

const PORT = 8080;

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js':   'application/javascript',
    '.css':  'text/css',
    '.ico':  'image/x-icon',
};

http.createServer((req, res) => {

    // ── API proxy ────────────────────────────────────────────────────────────
    if (req.method === 'POST' && req.url === '/api/messages') {
        let body = '';
        req.on('data', chunk => (body += chunk));
        req.on('end', () => {
            const proxyReq = https.request(
                {
                    hostname: 'api.anthropic.com',
                    path:     '/v1/messages',
                    method:   'POST',
                    headers:  {
                        'content-type':      'application/json',
                        'x-api-key':         req.headers['x-api-key']         || '',
                        'anthropic-version': req.headers['anthropic-version'] || '2023-06-01',
                        'content-length':    Buffer.byteLength(body),
                    },
                },
                proxyRes => {
                    res.writeHead(proxyRes.statusCode, {
                        'content-type': 'application/json',
                    });
                    proxyRes.pipe(res);
                }
            );
            proxyReq.on('error', err => {
                res.writeHead(502, { 'content-type': 'application/json' });
                res.end(JSON.stringify({ error: { message: err.message } }));
            });
            proxyReq.write(body);
            proxyReq.end();
        });
        return;
    }

    // ── Static files ─────────────────────────────────────────────────────────
    let urlPath = req.url.split('?')[0];
    if (urlPath === '/') urlPath = '/planner-import.html';
    const filePath = path.join(__dirname, urlPath);

    // Safety: don't serve files outside this directory
    if (!filePath.startsWith(__dirname)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    try {
        const content = fs.readFileSync(filePath);
        const ext     = path.extname(filePath).toLowerCase();
        res.writeHead(200, { 'content-type': MIME[ext] || 'text/plain' });
        res.end(content);
    } catch {
        res.writeHead(404, { 'content-type': 'text/plain' });
        res.end('Not found');
    }

}).listen(PORT, '127.0.0.1', () => {
    console.log(`\n  Planner Import  →  http://localhost:${PORT}/planner-import.html\n`);
});
