import { Server } from "socket.io";
import { createServer } from "http";
import express from "express";

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const PORT = 3000;

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

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
