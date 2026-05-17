# Project Name

A URL shortener with advanced analytics, including click tracking, country-based insights, device detection (Linux, Windows, Mac), and referrer tracking (LinkedIn, Twitter, etc.).

## 🚀 Features

- 🔗 **URL Shortening** using Base62 encoding
- 📊 **Advanced Analytics**: Click count, country tracking, device insights, and referral sources
- 🔒 **Secure Authentication** with JWT and bcrypt password hashing
- ⚡ **Performance Optimization** with Redis caching
- 📂 **Scalable Database Design** with PostgreSQL/MongoDB & optimized indexing
- 🛠 **Background Processing** with BullMQ for analytics updates
- 📡 **WebSocket Integration** for live tracking
- 📜 **RESTful APIs** with proper authentication

## 🏗 Tech Stack

- **Backend:** Node.js, Express.js, TypeScript
- **Database:** PostgreSQL(Prisma ORM)
- **Caching & Queues:** Redis, BullMQ
- **Authentication:** JWT Bearer tokens
- **Real-time Communication:** WebSockets
- **Containerization:** Docker

## 📦 Installation & Setup

1. Clone the repository:
   ```sh
   git clone https://github.com/amitskingh/url-shortner
   cd url-shortner
   ```

2. Install dependencies:
   ```sh
   npm install
   ```

3. Configure environment variables:
   Create a `.env` file and add the required variables:
   ```env
   DATABASE_URL=your_database_url
   REDIS_URL=your_redis_url
   JWT_SECRET=replace_with_a_long_random_secret
   JWT_EXPIRES_IN=7d
   PORT=8080

   # `AccountID` & `LicenseKey` is from your MaxMind account.
   AccountID=account_id
   LicenseKey=license_key
   ```

4. ```bash
      DATABASE_URL=postgresql://postgres:postgres@postgres:5432/mydb
                                 ↑
                           docker service/container name

      REDIS_URL=redis://redis:6379
                        ↑
                  docker service/container name
   ```

5. Start the development server:
   ```sh
   npm run dev
   npm run worker
   ```

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|---------|-------------|
| `POST` | `/api/auth/signup` | Create an account |
| `POST` | `/api/auth/login` | Log in and receive a JWT |
| `POST` | `/api/auth/logout` | Log out |
| `GET` | `/api/auth/me` | Get the current user |
| `GET` | `/api/v1/` | Fetch authenticated user's shortened URLs |
| `POST` | `/api/v1/short` | Shorten a URL |
| `DELETE` | `/api/v1/:aliasId` | Delete an authenticated user's short URL |
| `GET` | `/api/v1/:shortURL` | Redirect to Original URL |
| `GET` | `/api/v1/analytics/:aliasId` | Get URL Analytics |

## 📖 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature-branch`)
3. Commit your changes (`git commit -m 'Add new feature'`)
4. Push to the branch (`git push origin feature-branch`)
5. Create a Pull Request

## 📜 License

This project is licensed under the MIT License. Feel free to use and modify it!
