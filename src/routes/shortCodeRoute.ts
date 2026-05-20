import { Router } from "express";
import {
  redirectAlias,
} from "../controllers/aliasController";

const router = Router();

router.get("/:shortURL", redirectAlias);

export = router;
