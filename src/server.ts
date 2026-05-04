import http from "http";
import { setupWebSocket } from "./websocket/socket";
import { app } from "./app";
import { config } from "./config";

const server = http.createServer(app);

setupWebSocket(server);

const PORT = config.PORT;

server.listen(PORT, () => {
  console.log("server listening on port");
});
