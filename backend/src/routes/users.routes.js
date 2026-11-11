import express from "express";
import { getUsers } from "../controllers/users.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", authenticateToken, getUsers);

export default router;
