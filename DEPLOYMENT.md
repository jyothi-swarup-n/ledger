# Publishing Kinetic Ledger to `ledger.arsonist.online`

This guide walks you through publishing this app to your server (**`200.234.40.180`**) under the domain **`ledger.arsonist.online`**.

---

## Step 1: Add DNS Record for `ledger.arsonist.online`

Log into your DNS manager (Cloudflare, Hostinger DNS, Namecheap, etc.) and add an **A Record**:

| Type | Name / Host | Value / Target (VPS IP) | TTL |
| :--- | :--- | :--- | :--- |
| **A** | `ledger` | `200.234.40.180` | Auto or 300 |

*(If using Cloudflare, you can enable the orange proxy cloud for free automatic DDoS and SSL protection).*

---

## Step 2: Download or Clone the Code to your VPS

### Option A: Via Git / GitHub
1. In Google AI Studio, click **Settings > Export to GitHub** (or download the ZIP).
2. SSH into your VPS:
   ```bash
   ssh root@200.234.40.180
   ```
3. Clone into `/var/www/ledger`:
   ```bash
   git clone <YOUR_REPO_URL> /var/www/ledger
   cd /var/www/ledger
   ```

### Option B: Quick Direct Upload (rsync / scp)
If you have the files locally:
```bash
rsync -avz --exclude 'node_modules' --exclude '.git' ./ root@200.234.40.180:/var/www/ledger
```

---

## Step 3: Run with Docker Compose (Recommended)

Run the included container:
```bash
cd /var/www/ledger
docker compose up -d --build
```
This builds the production static bundle and serves it through optimized Nginx on port `3050`.

---

## Step 4: Configure Reverse Proxy & Automatic SSL

### Choice A: Using Caddy (Easiest — 2 Lines with Auto SSL)
If you run Caddy on your VPS, add this block to your `/etc/caddy/Caddyfile`:

```caddy
ledger.arsonist.online {
    reverse_proxy 127.0.0.1:3050
}
```
Reload Caddy:
```bash
caddy reload
```
*Caddy will automatically generate and renew a free Let's Encrypt SSL certificate.*

---

### Choice B: Using Nginx + Certbot
If your VPS uses Nginx as the main reverse proxy:

1. Create `/etc/nginx/sites-available/ledger.arsonist.online`:
```nginx
server {
    server_name ledger.arsonist.online;

    location / {
        proxy_pass http://127.0.0.1:3050;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

2. Enable the site and obtain free SSL:
```bash
ln -s /etc/nginx/sites-available/ledger.arsonist.online /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
certbot --nginx -d ledger.arsonist.online
```

---

## Step 5: Install App on your Phone

1. On your phone, open Google Chrome or Brave and go to **`https://ledger.arsonist.online`**.
2. Tap the **"Install App"** button (in the top bar or inside Profile Settings), or open the browser menu (⋮) and tap **"Install App"** / **"Add to Home screen"**.
3. Kinetic Ledger will install directly onto your home screen and run as a standalone, offline-ready native app.
