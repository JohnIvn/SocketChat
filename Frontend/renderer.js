import { io } from "socket.io-client";
import { exec } from "child_process";
import path from "path";

let socket = null;

const messages = document.getElementById("messages");
const modeRadios = document.getElementsByName("mode");
const connectFields = document.getElementById("connectFields");
const chatControls = document.getElementById("chatControls");

document.querySelectorAll("input[name='mode']").forEach((radio) => {
  radio.addEventListener("change", () => {
    connectFields.style.display = radio.value === "connect" ? "block" : "none";
  });
});

window.startConnection = async () => {
  const mode = [...modeRadios].find((r) => r.checked).value;

  if (mode === "host") {
    const __dirname = new URL(".", import.meta.url).pathname;
    const backendPath = path.join(__dirname, "../backend/server.js");
    exec(`node ${backendPath}`, (err, stdout, stderr) => {
      if (err) {
        console.error("Server failed to start:", stderr);
      } else {
        console.log("Server started:", stdout);
      }
    });
    connectToSocket("http://localhost:3000");
  } else {
    const ip = document.getElementById("ipAddress").value.trim();
    if (!ip) return alert("Enter server IP");
    connectToSocket(`http://${ip}:3000`);
  }
};

function connectToSocket(url) {
  socket = io(url);

  socket.on("connect", () => {
    log(`Connected to ${url}`);
    chatControls.style.display = "block";
  });

  socket.on("chat message", (data) => {
    log(`${data}`);
  });

  socket.on("disconnect", () => {
    log("Disconnected");
    chatControls.style.display = "none";
  });
}

window.emitCustomEvent = () => {
  const eventName = document.getElementById("eventName").value.trim();
  const eventData = document.getElementById("eventData").value.trim();

  if (!eventName) return alert("Enter event name");

  let payload;
  try {
    payload = JSON.parse(eventData);
  } catch {
    payload = eventData;
  }

  socket.emit(eventName, payload);
  log(`Emitted ${eventName}: ${eventData}`);
};

window.disconnect = () => {
  if (socket) {
    socket.disconnect();
    log("Disconnected by user");
  }
};

function log(text) {
  const el = document.createElement("div");
  el.textContent = text;
  messages.appendChild(el);
  messages.scrollTop = messages.scrollHeight;
}
