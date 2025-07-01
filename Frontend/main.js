import { app, BrowserWindow } from "electron";
import { io } from "socket.io-client";

let mainWindow;
let socket;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  mainWindow.loadFile("frontend/index.html");

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});

import { ipcMain } from "electron";

ipcMain.on("host-server", () => {
  connectToServer("http://localhost:3000");
});

ipcMain.on("connect-to-server", (event, serverAddress) => {
  connectToServer(serverAddress);
});

ipcMain.on("send-message", (event, message) => {
  if (socket) {
    socket.emit("chat message", message);
  }
});

ipcMain.on("set-username", (event, username) => {
  if (socket) {
    socket.emit("join", username);
  }
});

function connectToServer(serverAddress) {
  if (socket) {
    socket.disconnect();
  }

  socket = io(serverAddress);

  socket.on("connect", () => {
    mainWindow.webContents.send("connection-status", "connected");
  });

  socket.on("disconnect", () => {
    mainWindow.webContents.send("connection-status", "disconnected");
  });

  socket.on("chat message", (data) => {
    mainWindow.webContents.send("new-message", data);
  });
}
