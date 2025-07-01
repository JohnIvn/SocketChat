import { io } from "socket.io-client";

// Change this to LAN IP of the backend server for remote clients
const socket = io("http://localhost:3000");

const messagesDiv = document.getElementById("messages");
const input = document.getElementById("input");

socket.on("chat message", (msg) => {
  const item = document.createElement("div");
  item.textContent = msg;
  messagesDiv.appendChild(item);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
});

window.send = () => {
  const msg = input.value.trim();
  if (!msg) return;
  socket.emit("chat message", msg);
  input.value = "";
};
