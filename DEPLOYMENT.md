# Deployment Guide — Sunita's Collection (Node Only)

This guide covers deploying **Sunita's Collection** without Docker, using **Node.js + PM2** for the server and a **Vite build** for the client. Nginx is optional (used for SSL termination + static file serving).

---

## Prerequisites

| Requirement          | Version / Notes                          |
|----------------------|------------------------------------------|
| Node.js              | >= 20 (matches `server/package.json`)    |
| npm                  | >= 10                                    |
| PM2                  | `npm install -g pm2`                     |
| MongoDB              | MongoDB 5+ (local or Atlas)              |
| Nginx *(optional)*   | For SSL termination + static file caching |

---

## 1. Prepare the Environment

### 1.1 Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/Sunitas-Collection.git
cd Sunitas-Collection
```

### 1.2 Create the `.env` file (server)

Copy the example and fill in production values:

```bash
cd server
cp .env.example .env
```

Key production settings in `server/.env`:

```env
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb://localhost:27017/sunitas_collection
JWT_SECRET=your_long_random_jwt_secret_string
JWT_EXPIRE=7d
FRONTEND_URL=https://your_domain.com

# Email (for password resets, order confirmations)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_gmail_app_password
EMAIL_FROM="Sunita's Collection <your_email@gmail.com>"

# Cloudinary (recommended for image uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Payment gateways
ESEWA_ENV=test            # or 'live' for production
ESEWA_PRODUCT_CODE=your_product_code
ESEWA_SECRET_KEY=your_secret_key

KHALTI_ENV=test           # or 'live'
KHALTI_SECRET_KEY=your_khalti_secret

STRIPE_SECRET_KEY=your_stripe_secret
STRIPE_WEBHOOK_SECRET=your_webhook_signing_secret
```

> **Important:** Set `NODE_ENV=production` — this enables Express static file serving of the client build, rate limiting, and CSP enforcement.

### 1.3 Create the `.env` file (client)

```bash
cd client
cp .env.example .env
```

In `client/.env`, set the production API URL:

```env
VITE_API_URL=https://your_domain.com/api
VITE_SOCKET_URL=wss://your_domain.com
```

If you are using Express to serve the client build directly (no Nginx), set:

```env
VITE_API_URL=http://localhost:5000/api
```

### 1.4 Install dependencies

```bash
# Server (production-only deps)
cd server
npm install --omit=dev

# Client (needed for build)
cd ../client
npm install
```

Or use the root convenience scripts:

```bash
# From project root:
npm run install-server
npm run install-client
```

---

## 2. Build the Client

```bash
cd client
npm run build
```

The build output goes to `client/dist/`. The Express server will serve these static files in production.

---

## 3. Start the Server with PM2

### Option A: Direct PM2 (simplest)

From the **project root**:

```bash
pm2 start server/ecosystem.config.cjs --env production
```

This starts a single Node process (cluster mode) on **port 5000** that serves:
- The API at `http://localhost:5000/api/*`
- Uploaded files at `http://localhost:5000/uploads/*`
- The React SPA at `http://localhost:5000/*` (served from `client/dist`)

### Option B: Automated deploy script

```bash
bash scripts/deploy.sh
```

This script:
1. Installs server dependencies (`--omit=dev`)
2. Installs client dependencies
3. Builds the client
4. Creates the `uploads/` directory if missing
5. Starts or reloads the PM2 process

### Option C: Full PM2 deploy (remote)

For zero-downtime deploys from your dev machine to a remote server, configure the `deploy.production` section in `server/ecosystem.config.cjs` with your SSH host and git repo, then run:

```bash
pm2 deploy server/ecosystem.config.cjs production setup   # first time only
pm2 deploy server/ecosystem.config.cjs production         # subsequent deploys
```

---

## 4. (Optional) Nginx Reverse Proxy

Use Nginx if you want:
- HTTPS / SSL (Let's Encrypt)
- Better static file caching
- Cleaner domain-based routing

### 4.1 Install Nginx

```bash
sudo apt update && sudo apt install nginx -y
```

### 4.2 Copy the config

```bash
sudo cp nginx/sunitas-collection.conf /etc/nginx/sites-available/sunitas-collection
sudo ln -s /etc/nginx/sites-available/sunitas-collection /etc/nginx/sites-enabled/
```

### 4.3 Update paths in the config

Edit `/etc/nginx/sites-available/sunitas-collection`:
- Replace `your_domain.com` with your actual domain
- Update `root` to the absolute path of your `client/dist` directory
- Update SSL certificate paths (use Certbot for Let's Encrypt)

### 4.4 Get SSL certificate (recommended)

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your_domain.com
```

### 4.5 Enable and reload

```bash
sudo nginx -t          # test config
sudo systemctl reload nginx
```

With Nginx, PM2 still runs on `127.0.0.1:5000` (localhost only), and Nginx proxies `/api/` requests to it while serving the static client files directly.

---

## 5. Manage the Server

| Command                              | Description                          |
|--------------------------------------|--------------------------------------|
| `pm2 ls`                             | List running processes               |
| `pm2 logs sunitas-collection-api`    | Tail application logs                |
| `pm2 restart sunitas-collection-api` | Restart the server                   |
| `pm2 reload sunitas-collection-api`  | Zero-downtime reload                 |
| `pm2 stop sunitas-collection-api`    | Stop the server                      |
| `pm2 delete sunitas-collection-api`  | Remove from PM2                      |
| `pm2 save`                           | Save process list for reboot         |
| `pm2 startup`                        | Generate system startup script       |

### Persist PM2 across reboots

```bash
pm2 save
pm2 startup              # follows the on-screen instructions
```

---

## 6. Environment Variables Summary

### Server (`server/.env`)

| Variable                | Required | Description                              |
|-------------------------|----------|------------------------------------------|
| `NODE_ENV`              | Yes      | Set to `production`                      |
| `PORT`                  | Yes      | Server listen port (default: 5000)       |
| `MONGO_URI`             | Yes      | MongoDB connection string                |
| `JWT_SECRET`            | Yes      | Long random string for JWT signing       |
| `FRONTEND_URL`          | Yes      | Your domain (for CORS + cookies)         |
| `EMAIL_USER`            | Yes      | SMTP email for sending mails             |
| `EMAIL_PASS`            | Yes      | SMTP app password                        |
| `CLOUDINARY_*`          | No       | For image upload (falls back to local)   |
| `ESEWA_*`               | No       | eSewa payment gateway                    |
| `KHALTI_*`              | No       | Khalti payment gateway                   |
| `STRIPE_SECRET_KEY`     | No       | Stripe card payments                     |
| `STRIPE_WEBHOOK_SECRET` | No       | Stripe webhook verification              |

### Client (`client/.env`)

| Variable        | Required | Description                              |
|-----------------|----------|------------------------------------------|
| `VITE_API_URL`  | Yes      | API base URL (`/api` for same-origin)    |
| `VITE_SOCKET_URL`| No      | Socket.IO server URL (optional)          |

---

## 7. Folder Structure (Deployment)

```
Sunitas-Collection/
├── server/
│   ├── node_modules/         # installed with --omit=dev
│   ├── logs/                 # pm2 logs (auto-created)
│   ├── uploads/              # uploaded images (gitignored)
│   ├── src/
│   │   ├── server.js         # entry point
│   │   ├── app.js            # Express app (serves client build in prod)
│   │   └── ...
│   └── ecosystem.config.cjs  # PM2 configuration
├── client/
│   ├── dist/                 # built client (served by Express/Nginx)
│   ├── src/
│   └── ...
├── nginx/
│   └── sunitas-collection.conf
├── scripts/
│   └── deploy.sh
├── DEPLOYMENT.md
└── package.json              # root scripts
```

---

## Troubleshooting

| Problem                        | Solution                                           |
|--------------------------------|----------------------------------------------------|
| `EADDRINUSE` on port 5000      | Run `node scripts/check-and-kill-port.js` or set a different `PORT` |
| Client build not found         | Ensure you ran `cd client && npm run build`        |
| API returns 404 after deploy   | Check `NODE_ENV=production` in `server/.env`      |
| CORS errors                    | Verify `FRONTEND_URL` matches your domain exactly  |
| Upload images not loading      | Ensure `server/uploads/` exists and is writable    |
| PM2 not found                  | `npm install -g pm2`                               |
| MongoDB connection fails       | Verify `MONGO_URI` and that MongoDB is reachable   |
