import express  from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import chatsRoutes from "./routes/chats.routes.js";
import usersRoutes from "./routes/users.routes.js";

import cookieParser from "cookie-parser";
const app = express();

app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());

app.use("/api/auth", authRoutes)
app.use("/api/chats", chatsRoutes)
app.use("/api/users", usersRoutes)

export default app;