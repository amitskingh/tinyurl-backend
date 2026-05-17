import { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { config } from "../config";
import { redisSubscriber } from "../services/redis";
import { verifyAuthToken } from "../utils/jwt";
import { aliasRepository } from "../repositories/aliasRepository";
import { AuthTokenPayload } from "../../types/type";

import "socket.io";

declare module "socket.io" {
  interface Socket {
    user: AuthTokenPayload;
  }
}

export const setupWebSocket = (server: HttpServer) => {
  const io = new SocketIOServer(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Unauthorized"));
    try {
      const decoded = verifyAuthToken(String(token));
      socket.user = decoded; // Attach user info to socket
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  redisSubscriber.subscribe(config.clickChannel, (err) => {
    if (err) {
      console.error("Redis subscriber failed to subscribe:", err);
    }
  });

  redisSubscriber.on("message", (channel: string, message: string) => {
    if (channel === config.clickChannel) {
      try {
        const data = JSON.parse(message);
        // Assuming aliasId is passed elsewhere (e.g., via job metadata or Redis key)
        // For now, we'll need the aliasId to be included in the payload
        io.to(String(data.aliasId)).emit("clickUpdate", data);
      } catch (error) {
        console.error("Error parsing message:", error);
      }
    }
  });

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("join", async (aliasId: string | number) => {
      const parsedAliasId = Number(aliasId);
      const parsedUserId = Number(socket.user?.userId);

      if (Number.isNaN(parsedAliasId)) {
        return socket.emit("error", "Invalid alias id");
      }

      if (Number.isNaN(parsedUserId)) {
        return socket.emit("error", "Invalid user id");
      }

      const alias = await aliasRepository().findOwnedAlias(
        parsedAliasId,
        parsedUserId,
      );

      if (!alias) {
        return socket.emit("error", "Unauthorized");
      }

      socket.join(String(aliasId));
    });

    socket.on("leave", (aliasId: string | number) => {
      const room = String(aliasId);
      console.log(`${socket.id} left room ${room}`);
      socket.leave(room);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });
};
