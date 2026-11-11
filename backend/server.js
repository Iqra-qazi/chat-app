import dns from "node:dns";
import dotenv from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Server } from "socket.io";
import { createServer } from "http";

dns.setServers(["9.9.9.9", "149.112.112.112"]);
const backendDir = dirname(fileURLToPath(import.meta.url));
dotenv.config({
  path: [resolve(backendDir, ".env"), resolve(backendDir, "../.env")]
});

const [{ default: app }, { default: connectDB }] = await Promise.all([
  import("./src/app.js"),
  import("./src/db/db.js")
]);

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: "*"
});

io.on("connection", (socket) => {
 console.log("Socket Connected", socket.id);
 socket.on("add-todo",(data)=>{
    console.log(data);    
 })
 
});

try {
  await connectDB();
  httpServer.listen(5000, () => {
    console.log("Example app listening on port 5000");
  });
} catch (error) {
  console.error("Error connecting to DB", error);
  process.exit(1);
}