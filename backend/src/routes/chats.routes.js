import express from "express";
import { getUserChats } from "../controllers/chats.controller.js";
import { authenticateToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", authenticateToken, getUserChats);

export default router;
