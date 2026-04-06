# Configuration Reference

| Setting | Type | Default | Description |
|---|---|---|---|
| JWT_SECRET | string | required | Access token signing secret |
| JWT_REFRESH_SECRET | string | required | Refresh token secret |
| SESSION_SECRET | string | required | Session middleware secret |
| PORT | number | 4000 | Backend listen port |
| DB_PATH | string | ./website/backend/data/crept.db | SQLite path |
| DOWNLOAD_URL | string | n/a | Download target URL |
| CHECKOUT_*_URL | string | n/a | Checkout links by tier |
| SMTP_* | string/number | n/a | Email transport settings |
