/**
 * Temp Mail - Main Application
 * Web server + SMTP server
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const config = require('../config');
const db = require('./database');
const SMTPServer = require('./smtp');

// MIME types
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};

// Parse JSON body
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

// Send JSON response
function sendJSON(res, data, status = 200) {
  res.writeHead(status, { 
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  });
  res.end(JSON.stringify(data));
}

// Generate random username
function generateUsername() {
  const adjectives = ['quick', 'lazy', 'happy', 'sad', 'bright', 'dark', 'cool', 'warm', 'fast', 'slow', 'wild', 'calm', 'bold', 'shy', 'free'];
  const nouns = ['fox', 'cat', 'dog', 'bird', 'wolf', 'bear', 'deer', 'hawk', 'fish', 'lion', 'tiger', 'eagle', 'shark', 'panda', 'koala'];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 999);
  return `${adj}.${noun}${num}`;
}

// Create HTTP server
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // CORS preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }

  // API Routes
  if (pathname.startsWith('/api/')) {
    
    // GET /api/domains - Get available domains
    if (pathname === '/api/domains' && method === 'GET') {
      return sendJSON(res, { domains: config.DOMAINS });
    }

    // GET /api/generate - Generate random email address
    if (pathname === '/api/generate' && method === 'GET') {
      const domain = parsedUrl.query.domain || config.DOMAINS[0];
      const username = generateUsername();
      const address = `${username}@${domain}`;
      db.getOrCreateMailbox(address);
      return sendJSON(res, { address });
    }

    // POST /api/mailbox - Create/access mailbox with specific address
    if (pathname === '/api/mailbox' && method === 'POST') {
      const body = await parseBody(req);
      if (!body.address) {
        return sendJSON(res, { error: 'Address is required' }, 400);
      }
      const address = body.address.toLowerCase();
      const domain = address.split('@')[1];
      if (!config.DOMAINS.includes(domain)) {
        return sendJSON(res, { error: 'Invalid domain. Available: ' + config.DOMAINS.join(', ') }, 400);
      }
      db.getOrCreateMailbox(address);
      return sendJSON(res, { address });
    }

    // GET /api/emails?address=xxx - Get emails for address
    if (pathname === '/api/emails' && method === 'GET') {
      const address = parsedUrl.query.address;
      if (!address) {
        return sendJSON(res, { error: 'Address parameter required' }, 400);
      }
      const emails = db.getEmails(address);
      return sendJSON(res, { emails, count: emails.length });
    }

    // GET /api/email/:id - Get single email
    if (pathname.match(/^\/api\/email\/[^/]+$/) && method === 'GET') {
      const id = pathname.split('/').pop();
      const email = db.getEmail(id);
      if (!email) {
        return sendJSON(res, { error: 'Email not found' }, 404);
      }
      db.markAsRead(id);
      return sendJSON(res, { email });
    }

    // DELETE /api/email/:id - Delete single email
    if (pathname.match(/^\/api\/email\/[^/]+$/) && method === 'DELETE') {
      const id = pathname.split('/').pop();
      db.deleteEmail(id);
      return sendJSON(res, { success: true });
    }

    // DELETE /api/emails?address=xxx - Delete all emails for address
    if (pathname === '/api/emails' && method === 'DELETE') {
      const address = parsedUrl.query.address;
      if (!address) {
        return sendJSON(res, { error: 'Address parameter required' }, 400);
      }
      db.deleteAllEmails(address);
      return sendJSON(res, { success: true });
    }

    // GET /api/config - Get public config info
    if (pathname === '/api/config' && method === 'GET') {
      return sendJSON(res, {
        domains: config.DOMAINS,
        expiryMinutes: config.EMAIL_EXPIRY_MINUTES,
        smtpPort: config.SMTP_PORT
      });
    }

    return sendJSON(res, { error: 'Not Found' }, 404);
  }

  // Serve static files
  let filePath = pathname === '/' ? '/index.html' : pathname;
  filePath = path.join(__dirname, '..', 'public', filePath);

  // Security: prevent directory traversal
  const publicDir = path.resolve(__dirname, '..', 'public');
  const resolvedPath = path.resolve(filePath);
  if (!resolvedPath.startsWith(publicDir)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  try {
    const stat = fs.statSync(resolvedPath);
    if (stat.isFile()) {
      const ext = path.extname(resolvedPath);
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      const content = fs.readFileSync(resolvedPath);
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  } catch (e) {
    res.writeHead(404);
    res.end('Not Found');
  }
});

// Start servers
server.listen(config.WEB_PORT, config.WEB_HOST, () => {
  console.log('='.repeat(50));
  console.log('  TEMP MAIL - Disposable Email Service');
  console.log('='.repeat(50));
  console.log(`  Web Interface: http://localhost:${config.WEB_PORT}`);
  console.log(`  Domains: ${config.DOMAINS.join(', ')}`);
  console.log(`  Email Expiry: ${config.EMAIL_EXPIRY_MINUTES} minutes`);
  console.log('='.repeat(50));
});

// Start SMTP server
const smtp = new SMTPServer();
smtp.start();
