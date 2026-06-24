# TempMail - Disposable Email Service

A lightweight temporary email application with **custom domain support** and a simple classic UI.
Built with zero external dependencies - uses only Node.js built-in modules.

## Features

- **Custom Domain Support** - Use your own domains for receiving emails
- **SMTP Server** - Built-in SMTP server to receive emails directly
- **Web Interface** - Simple, classic, responsive UI
- **Random Address Generator** - Generate random email addresses instantly
- **Custom Usernames** - Choose your own username@domain
- **Auto-Refresh** - Inbox updates automatically every 5 seconds
- **Email Viewer** - View emails in Text, HTML, or Source format
- **Auto-Cleanup** - Emails automatically expire after configured time
- **No Dependencies** - Pure Node.js, no npm packages needed

## Quick Start

```bash
# Start the server
node server/app.js

# Or with custom domains:
MAIL_DOMAINS=yourdomain.com,other.com node server/app.js
```

Open http://localhost:3000 in your browser.

## Custom Domain Setup

### 1. Configure Domains

Edit `config.js`:
```javascript
DOMAINS: ['yourdomain.com', 'anotherdomain.com']
```

Or use environment variable:
```bash
MAIL_DOMAINS=yourdomain.com,anotherdomain.com
```

### 2. DNS Configuration

Add an MX record for your domain pointing to your server:
```
Type: MX
Host: yourdomain.com
Value: mail.yourdomain.com (or your server IP)
Priority: 10
```

### 3. Production Setup

For production, use port 25 (requires root/sudo):
```bash
SMTP_PORT=25 node server/app.js
```

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `MAIL_DOMAINS` | `tempmail.local,mymail.com` | Comma-separated list of domains |
| `SMTP_PORT` | `2525` | SMTP server port (use 25 for production) |
| `WEB_PORT` | `3000` | Web interface port |
| `EMAIL_EXPIRY` | `60` | Minutes before emails auto-delete |
| `DB_PATH` | `./data/emails.json` | Database file path |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/domains` | List available domains |
| GET | `/api/generate?domain=x` | Generate random address |
| POST | `/api/mailbox` | Create mailbox with custom address |
| GET | `/api/emails?address=x` | Get inbox for address |
| GET | `/api/email/:id` | Get single email |
| DELETE | `/api/email/:id` | Delete single email |
| DELETE | `/api/emails?address=x` | Delete all emails |
| GET | `/api/config` | Get public config info |

## Project Structure

```
temp-mail/
├── config.js          # Configuration (domains, ports, etc.)
├── server/
│   ├── app.js         # HTTP server + API routes
│   ├── smtp.js        # SMTP server for receiving emails
│   └── database.js    # JSON file-based storage
├── public/
│   ├── index.html     # Web interface
│   ├── style.css      # Classic styling
│   └── app.js         # Frontend logic
├── data/
│   └── emails.json    # Email storage (auto-created)
├── test.js            # Integration tests
└── README.md
```

## Testing

```bash
bash run-test.sh
```

## License

MIT
