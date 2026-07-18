# Visa Dolphins

A responsive, dark-themed swimming club website with an admin panel and REST API.

## Architecture

The project is split into **3 independently deployable apps** sharing a single MySQL database:

| Folder | Purpose | Deploys to |
|--------|---------|------------|
| `api/` | PHP REST API (admin + public endpoints, uploads, migrations) | `api.visadolphins.co.ke` |
| `admin/` | Admin dashboard frontend (HTML/CSS/JS) | `admin.visadolphins.co.ke` |
| `website/` | Public website frontend (HTML/CSS/JS) | `visadolphins.co.ke` |

## Getting Started (Docker)

```bash
docker compose up --build
```

| Service | URL |
|---------|-----|
| API | http://localhost:8082 |
| Admin | http://localhost:8083 |
| Website | http://localhost:8084 |
| phpMyAdmin | http://localhost:8081 |

Run migrations: `http://localhost:8082/migrate.php?key=YOUR_MIGRATION_KEY`

## Configuration

- **API config**: `api/config/database.php`, `api/config/env.php`
- **Admin JS config**: `admin/js/config.js` — set `API_BASE_URL` to your API domain
- **Website JS config**: `website/js/config.js` — set `API_BASE_URL` to your API domain

## Deployment (cPanel)

1. Upload `api/` to `api.visadolphins.co.ke` document root
2. Upload `admin/` to `admin.visadolphins.co.ke` document root
3. Upload `website/` to `visadolphins.co.ke` document root
4. Update `admin/js/config.js` and `website/js/config.js` with production API URL
5. Set environment variables or create `api/.env` with DB credentials

## Structure

```
├── api/                 PHP backend
│   ├── admin/           Protected admin API endpoints
│   ├── public/          Public read-only API endpoints
│   ├── config/          Database & environment config
│   ├── helpers/         Auth & JWT helpers
│   ├── database/        Migrations & seeds
│   └── uploads/         Uploaded media files
├── admin/               Admin frontend
│   ├── css/             Admin styles
│   ├── js/              Admin scripts (config.js for API URL)
│   └── *.html           Admin pages
├── website/             Public website frontend
│   ├── css/             Website styles
│   ├── js/              Website scripts (config.js for API URL)
│   └── *.html           Website pages
├── docker-compose.yml   Local dev (3 services + DB + phpMyAdmin)
└── .env                 Environment variables
```