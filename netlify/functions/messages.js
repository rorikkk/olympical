/**
 * Netlify serverless function — proxies POST /api/messages to Anthropic.
 * The user's API key is read from the x-api-key request header and
 * forwarded directly; it is never stored.
 */

const https = require('https');

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    const apiKey = event.headers['x-api-key'] || '';
    if (!apiKey) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: { message: 'Missing x-api-key header' } }),
        };
    }

    const body = event.body || '{}';

    try {
        const result = await proxyToAnthropic(apiKey, body);
        return {
            statusCode: result.status,
            headers: { 'Content-Type': 'application/json' },
            body: result.body,
        };
    } catch (err) {
        return {
            statusCode: 502,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ error: { message: err.message } }),
        };
    }
};

function proxyToAnthropic(apiKey, body) {
    return new Promise((resolve, reject) => {
        const data = Buffer.from(body, 'utf8');
        const req = https.request(
            {
                hostname: 'api.anthropic.com',
                path:     '/v1/messages',
                method:   'POST',
                headers:  {
                    'content-type':      'application/json',
                    'x-api-key':         apiKey,
                    'anthropic-version': '2023-06-01',
                    'content-length':    data.length,
                },
            },
            res => {
                let body = '';
                res.on('data', chunk => (body += chunk));
                res.on('end', () => resolve({ status: res.statusCode, body }));
            }
        );
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}
