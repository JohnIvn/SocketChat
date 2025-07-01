import { Server } from "socket.io";
import { createServer } from "http";

let httpServer;
let io;

export function startServer(port = 3000) {
  return new Promise((resolve, reject) => {
    try {
      if (httpServer) {
        httpServer.close();
      }

      httpServer = createServer();
      io = new Server(httpServer, {
        cors: {
          origin: "*",
          methods: ["GET", "POST"],
        },
      });

      io.on("connection", (socket) => {
        console.log("a user connected");

        socket.on("join", (username) => {
          socket.username = username;
          io.emit("chat message", {
            user: "System",
            message: `${username} has joined the chat`,
          });
        });

        socket.on("chat message", (msg) => {
          io.emit("chat message", {
            user: socket.username,
            message: msg,
          });
        });

        socket.on("disconnect", () => {
          if (socket.username) {
            io.emit("chat message", {
              user: "System",
              message: `${socket.username} has left the chat`,
            });
          }
          console.log("user disconnected");
        });
      });

      httpServer.listen(port, () => {
        console.log(`Server running on port ${port}`);
        resolve({ io, port });
      });

      httpServer.on("error", (err) => {
        reject(err);
      });
    } catch (error) {
      reject(error);
    }
  });
}

export function stopServer() {
  return new Promise((resolve) => {
    if (io) {
      io.close(() => {
        console.log("Socket.IO server closed");
        if (httpServer) {
          httpServer.close(() => {
            console.log("HTTP server closed");
            httpServer = null;
            io = null;
            resolve();
          });
        } else {
          resolve();
        }
      });
    } else {
      resolve();
    }
  });
}
