import express from "express";
import cors from "cors";
import morgan from "morgan";

import aliasRouter from "./routes/aliasRoute";
import analyticsRouter from "./routes/analyticsRoute";
import authRouter from "./routes/authRoute";
import shortCodeRouter from "./routes/shortCodeRoute";
import authenticate from "./middlewares/authenticate";
import { appendUserdId } from "./middlewares/appendUserId";
import { attachUser } from "./middlewares/attachUser";
import { errorHandler } from "./middlewares/errorHandler";
import { apiRateLimiter } from "./middlewares/rateLimits";
import { config } from "./config";

const createServer = () => {
  const app = express();
  return app;
};

const app = createServer();
app.set("trust proxy", true);

app.use(
  cors({
    origin: config.CORS_ORIGIN === "*" ? true : config.CORS_ORIGIN,
    methods: ["GET", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(morgan("dev"));
app.use(express.json({ limit: "32kb" }));
app.use(attachUser);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", uptimeSec: Math.round(process.uptime()) });
});

app.use("/api/auth", apiRateLimiter, authRouter);
app.use("/api/v1", apiRateLimiter, appendUserdId, aliasRouter);
app.use("/api/v1/analytics", authenticate, analyticsRouter);

// Public redirect route WITHOUT strict API limiter
app.use("/s", shortCodeRouter);

app.use(errorHandler);

export { createServer, app };
