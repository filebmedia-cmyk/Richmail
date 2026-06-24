/**
 * Configuration for RichMail
 * 
 * Deploy: Render.com (free) + Cloudflare Email Routing
 */

module.exports = {
  // Default domain(s) - can be managed via admin panel
  DOMAINS: process.env.MAIL_DOMAINS 
    ? process.env.MAIL_DOMAINS.split(',') 
    : ['richmail.web.id'],

  // Web Server settings  
  WEB_PORT: parseInt(process.env.PORT || process.env.WEB_PORT || '3000'),
  WEB_HOST: process.env.WEB_HOST || '0.0.0.0',

  // Webhook secret (to verify Cloudflare requests)
  WEBHOOK_SECRET: process.env.WEBHOOK_SECRET || 'richmail-secret-key-2026',

  // Admin panel password
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'admin123',

  // Email settings
  EMAIL_EXPIRY_MINUTES: parseInt(process.env.EMAIL_EXPIRY || '60'),

  // Database (JSON file-based)
  DB_PATH: process.env.DB_PATH || './data/emails.json',

  // Domain config file
  DOMAIN_CONFIG_PATH: process.env.DOMAIN_CONFIG_PATH || './data/domains.json'
};
