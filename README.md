# Gather chat

A responsive React, Vite, and TypeScript chat frontend using Axios, Zustand, Tailwind CSS, and Socket.IO.

## Run locally

1. Install Node.js 20 or newer.
2. From the project root, run `npm install`.
3. Copy `.env.example` to `.env` and set `VITE_API_URL` to your backend API URL.
4. Copy `backend/.env.example` to `backend/.env` and set `MONGO_URI` to your MongoDB connection string.
5. From `backend/`, run `npm install` and `npm start`. The backend currently listens on port `5000`.
6. From the project root, run `npm run dev` and open the local URL printed by Vite.
7. Run `npm run build` to type-check and create the production bundle in `dist/`.

The app expects the API endpoints listed below. `src/services/api.ts` contains the response normalization and all HTTP endpoint functions, so backend-specific response shapes can be adjusted in one place.

## Backend compatibility

The existing backend currently implements only `POST /auth/register` and `POST /auth/login`. It uses `username` rather than `name`, and sets a `token` cookie. The client sends both `name` and `username` during registration and both `email` and `username` during login, includes credentials, and also attaches a returned JWT as a Bearer token. The frontend stores returned credentials for the current browser tab only; the API cookie is used when the backend authenticates via cookies.

The chat UI additionally expects:

- Authenticated `GET /users`, returning `{ users: [...] }` without password fields.
- `GET /chats`, returning an array or `{ chats: [...] }` / `{ data: [...] }`.
- `POST /chats` with `{ userId }` to begin a conversation.
- `GET /messages/:chatId?limit=30&before=<timestamp>`.
- `POST /messages` with `{ chatId, text }`.
- `PATCH /users/me` with `{ name }` to edit the profile.
- A Socket.IO server that accepts the `token` auth payload and emits `message:new`, `typing`, `user:online`, `message:delivered`, and `message:seen`. The client emits `typing` and `message:seen`.

The remaining chat/profile routes and events are not present in the current backend, so they must be implemented there before those features can exchange live data. For cross-origin deployments, configure backend CORS to allow the frontend origin and credentials; cookie-based auth also requires compatible `SameSite`/`Secure` cookie settings.
