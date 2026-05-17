import { Router } from "express";
import { login, logout, me, signup } from "../controllers/authController";
import authenticate from "../middlewares/authenticate";

const router = Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", authenticate, logout);
router.get("/me", authenticate, me);

export default router;
