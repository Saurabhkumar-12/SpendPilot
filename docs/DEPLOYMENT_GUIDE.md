# SpendPilot Production Deployment Guide

---

## 1. Production Build Commands

### Backend Verification & Build
```bash
cd server
npm test
npm start
```

### Frontend Static Bundle Build
```bash
cd client
npm run build
```
The output static bundle will be generated inside `client/dist/`.

---

## 2. Docker Containerization (Optional)

### Backend `Dockerfile`
```dockerfile
FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

---

## 3. Reverse Proxy & Nginx Setup

```nginx
server {
    listen 80;
    server_name spendpilot.yourdomain.com;

    location / {
        root /var/www/spendpilot/client/dist;
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
