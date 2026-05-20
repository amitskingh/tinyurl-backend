# tiny-url Backend

A URL shortener backend with analytics, click tracking, geo and device detection, referrer tracking, and authenticated user management.

## 🚀 Features

- 🔗 **Short URL creation** with Base62-style code generation
- 📊 **Analytics tracking** for clicks, device type, country, and referrer
- 🔒 **Authentication** with JWT and bcrypt password hashing
- ⚡ **Redis caching** for redirect lookups and queue coordination
- 🛠 **Background processing** with BullMQ for analytics updates
- 📡 **WebSocket-ready** architecture for real-time updates
- 📜 **REST API** with protected endpoints for alias and analytics operations

## 🏗 Tech Stack

- **Backend:** Node.js, Express.js, TypeScript
- **Database:** PostgreSQL with Prisma ORM
- **Caching & Queues:** Redis, BullMQ
- **Authentication:** JWT
- **Real-time Communication:** Socket.IO / WebSockets
- **Containerization:** Docker

## 📦 Installation & Setup

1. From the `backend` directory, install dependencies:

   ```sh
   npm install
   ```

2. Create a `.env` file in the `backend` folder and add required values:

   ```env
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/mydb
   REDIS_URL=redis://127.0.0.1:6379
   JWT_SECRET=replace_with_a_long_random_secret
   JWT_EXPIRES_IN=7d
   PORT=3000
   CORS_ORIGIN=*

   # Optional MaxMind GeoIP credentials for country lookups
   AccountID=account_id
   LicenseKey=license_key

   # Optional tuning values
   SHORT_CODE_LENGTH=8
   SHORT_CODE_MAX_ATTEMPTS=8
   ALIAS_CACHE_TTL_SEC=86400
   ```

3. Run the development server:

   ```sh
   npm run dev
   ```

4. Build and run the worker process after compiling:

   ```sh
   npm run build
   npm run worker
   ```

5. Useful commands:
   ```sh
   npm run start     # run the compiled production server
   npm test          # run Jest tests
   npm run lint      # run ESLint
   ```
6. Run in docker:
   ```sh
   docker compose --env-file .env.local -f docker-compose.local.yml up --build
   ```
   ```sh
   docker compose --env-file .env.dev docker-compose -f docker-compose.dev.yml up --build
   ```
   ```sh
   docker compose --env-file .env.prod docker-compose -f docker-compose.prod.yml up --build
   ```

```


## 🧩 Notes

- The backend loads `.env` from the `backend` folder.
- `AccountID` and `LicenseKey` are optional; analytics degrade gracefully when MaxMind geo lookup is unavailable.
- The worker process uses the compiled `dist` output, so run `npm run build` before `npm run worker`.

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `POST` | `/api/auth/signup` | Create a user account |
| `POST` | `/api/auth/login` | Log in and receive a JWT |
| `POST` | `/api/auth/logout` | Log out (requires auth) |
| `GET` | `/api/auth/me` | Get current authenticated user |
| `GET` | `/api/v1/` | List authenticated user's short URLs |
| `POST` | `/api/v1/short` | Create a new short URL |
| `DELETE` | `/api/v1/:aliasId` | Delete a user's short URL |
| `GET` | `/api/v1/:shortURL` | Redirect to the original URL |
| `GET` | `/api/v1/analytics/:aliasId` | Fetch analytics for a short URL |


## 📖 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature-branch`)
3. Commit your changes (`git commit -m 'Add new feature'`)
4. Push to the branch (`git push origin feature-branch`)
5. Open a Pull Request

## 📜 License

This backend is licensed under ISC.
```
