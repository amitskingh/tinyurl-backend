# Use Node.js LTS version
FROM node:22-alpine

# Set working directory inside container
WORKDIR /app

# Copy dependency files first
# Helps Docker cache dependencies efficiently
COPY package.json package-lock.json ./

# Install dependencies
# npm ci is preferred for Docker/CI environments
RUN npm ci

# Copy all project files
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript project
RUN npm run build

# Expose application port
EXPOSE 8080

# =========================
# Development Command
# Use this while local development with hot reload
# Requires dev dependencies
# =========================
# CMD ["npm", "run", "dev"]

# =========================
# Production Command
# Runs Prisma migrations first
# Then starts compiled application
# =========================
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]