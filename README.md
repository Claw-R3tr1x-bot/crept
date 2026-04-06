# Crept

Crept is a production-ready full-stack web platform with authentication, licensing, support forms, documentation, wiki content, and admin operations.

## Monorepo Structure

```
crept/
├── website/
│   ├── backend/
│   ├── frontend/
│   ├── assets/
│   ├── systems/
│   ├── forms/
│   ├── docs/
│   └── wiki/
├── package.json
└── .env.example
```

## Setup

1. Install dependencies

```bash
npm install
```

2. Copy env file

```bash
cp .env.example .env
```

3. Seed DB

```bash
npm run seed
```

4. Run development

```bash
npm run dev
```

## Environment Variables

See `.env.example` for all required values:
- JWT_SECRET
- JWT_REFRESH_SECRET
- SESSION_SECRET
- PORT
- DB_PATH
- FRONTEND_URL
- DOWNLOAD_URL
- CHECKOUT_BASIC_URL
- CHECKOUT_PRO_URL
- CHECKOUT_ELITE_URL
- SMTP_*

## First Admin User

Run `npm run seed` and use:
- email: `admin@crept.com`
- password: `Admin1234!`
