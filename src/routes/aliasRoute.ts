import { Router } from "express";
import {
  createAlias,
  deleteAlias,
  fetchAllAlias,
  redirectAlias,
} from "../controllers/aliasController";
import { shortCreationRateLimiter } from "../middlewares/rateLimits";

const router = Router();

router.get("/", fetchAllAlias);

router.post("/short", shortCreationRateLimiter, createAlias);

router.delete("/:aliasId", deleteAlias);

router.get("/:shortURL", redirectAlias);

export = router;
