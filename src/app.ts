import "./firebase/firebase";
import express from "express";
import cors from "cors";
import morgan from "morgan";

import aliasRouter from "./routes/aliasRoute";
import analyticsRouter from "./routes/analyticsRoute";
import authRouter from "./routes/authRoute";
import authenticate from "./middlewares/authenticate";
import { appendUserdId } from "./middlewares/appendUserId";
import { attachUser } from "./middleware/attachUser";
import { errorHandler } from "./middleware/errorHandler";
import { apiRateLimiter } from "./middleware/rateLimits";
import { config } from "./config";

const createServer = () => {
  const app = express();
  return app;
};

const app = createServer();

app.use(
  cors({
    origin: config.CORS_ORIGIN === "*" ? true : config.CORS_ORIGIN,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(morgan("dev"));
app.use(express.json({ limit: "32kb" }));
app.use(attachUser);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", uptimeSec: Math.round(process.uptime()) });
});

app.use("/api/v1/auth", apiRateLimiter, authRouter);
app.use("/api/v1", apiRateLimiter, appendUserdId, aliasRouter);
app.use("/api/v1/analytics", authenticate, analyticsRouter);

app.use(errorHandler);

export { createServer, app };
