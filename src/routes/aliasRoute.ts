import { Router } from "express";
import {
  createAlias,
  fetchAllAlias,
  redirectAlias,
} from "../controllers/aliasController";
import { shortCreationRateLimiter } from "../middleware/rateLimits";

const router = Router();

router.get("/", fetchAllAlias);

router.post("/short", shortCreationRateLimiter, createAlias);

router.get("/:shortURL", redirectAlias);

export = router;
