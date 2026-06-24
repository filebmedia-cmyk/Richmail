/**
 * Configuration for Temp Mail Application
 * 
 * CUSTOM DOMAIN SETUP:
 * 1. Set your domain(s) in the DOMAINS array below
 * 2. Point your domain's MX record to this server's IP
 * 3. Example MX record: mail.yourdomain.com -> YOUR_SERVER_IP (priority 10)
 */

module.exports = {
  // Custom domains for receiving emails
  // Add your own domains here
  DOMAINS: process.env.MAIL_DOMAINS 
    ? process.env.MAIL_DOMAINS.split(',') 
    : ['tempmail.local', 'mymail.com'],

  // SMTP Server settings (port 25 requires root, use 2525 for dev)
  SMTP_PORT: parseInt(process.env.SMTP_PORT || '2525'),
  SMTP_HOST: process.env.SMTP_HOST || '0.0.0.0',

  // Web Server settings  
  WEB_PORT: parseInt(process.env.WEB_PORT || '3000'),
  WEB_HOST: process.env.WEB_HOST || '0.0.0.0',

  // Email settings
  EMAIL_EXPIRY_MINUTES: parseInt(process.env.EMAIL_EXPIRY || '60'),
  MAX_EMAIL_SIZE: 1024 * 1024 * 5, // 5MB max email size

  // Database (JSON file-based)
  DB_PATH: process.env.DB_PATH || './data/emails.json'
};
