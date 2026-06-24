/**
 * Simple JSON file-based database for storing emails
 */

const fs = require('fs');
const path = require('path');
const config = require('../config');

const DB_FILE = path.resolve(__dirname, '..', config.DB_PATH);

// Ensure data directory exists
const dataDir = path.dirname(DB_FILE);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize DB file if not exists
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify({ emails: [], mailboxes: [] }));
}

function readDB() {
  try {
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    return { emails: [], mailboxes: [] };
  }
}

function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

// Generate a random ID
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// Create or get a mailbox
function getOrCreateMailbox(address) {
  const db = readDB();
  let mailbox = db.mailboxes.find(m => m.address === address.toLowerCase());
  if (!mailbox) {
    mailbox = {
      id: generateId(),
      address: address.toLowerCase(),
      createdAt: new Date().toISOString()
    };
    db.mailboxes.push(mailbox);
    writeDB(db);
  }
  return mailbox;
}

// Save an email
function saveEmail(email) {
  const db = readDB();
  const record = {
    id: generateId(),
    to: email.to,
    from: email.from,
    subject: email.subject || '(No Subject)',
    body: email.body || '',
    html: email.html || '',
    date: email.date || new Date().toISOString(),
    read: false
  };
  db.emails.push(record);
  writeDB(db);
  return record;
}

// Get emails for a specific address
function getEmails(address) {
  const db = readDB();
  return db.emails
    .filter(e => e.to.toLowerCase() === address.toLowerCase())
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

// Get a single email by ID
function getEmail(id) {
  const db = readDB();
  return db.emails.find(e => e.id === id) || null;
}

// Mark email as read
function markAsRead(id) {
  const db = readDB();
  const email = db.emails.find(e => e.id === id);
  if (email) {
    email.read = true;
    writeDB(db);
  }
  return email;
}

// Delete an email
function deleteEmail(id) {
  const db = readDB();
  db.emails = db.emails.filter(e => e.id !== id);
  writeDB(db);
}

// Delete all emails for an address
function deleteAllEmails(address) {
  const db = readDB();
  db.emails = db.emails.filter(e => e.to.toLowerCase() !== address.toLowerCase());
  writeDB(db);
}

// Clean up expired emails
function cleanupExpired() {
  const db = readDB();
  const expiryTime = config.EMAIL_EXPIRY_MINUTES * 60 * 1000;
  const now = Date.now();
  db.emails = db.emails.filter(e => {
    return (now - new Date(e.date).getTime()) < expiryTime;
  });
  writeDB(db);
}

// Run cleanup every 5 minutes
setInterval(cleanupExpired, 5 * 60 * 1000);

module.exports = {
  getOrCreateMailbox,
  saveEmail,
  getEmails,
  getEmail,
  markAsRead,
  deleteEmail,
  deleteAllEmails,
  cleanupExpired,
  generateId
};
