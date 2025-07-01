import { app, BrowserWindow, ipcMain } from "electron";
import { io } from "socket.io-client";
import { startServer, stopServer } from "../Backend/server.js";

let mainWindow;
let socket;
let serverInstance;

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

ipcMain.handle("host-server", async (event, port = 3000) => {
  try {
    if (serverInstance) {
      await stopServer();
    }
    serverInstance = await startServer(port);
    mainWindow.webContents.send("server-status", { status: "running", port });
    return port;
  } catch (error) {
    console.error("Error starting server:", error);
    mainWindow.webContents.send("server-status", {
      status: "error",
      error: error.message,
    });
    throw error;
  }
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

ipcMain.handle("stop-server", async () => {
  try {
    await stopServer();
    serverInstance = null;
    mainWindow.webContents.send("server-status", { status: "stopped" });
    return true;
  } catch (error) {
    console.error("Error stopping server:", error);
    throw error;
  }
});

function connectToServer(serverAddress) {
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  try {
    socket = io(serverAddress, {
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
      timeout: 2000,
    });

    socket.on("connect", () => {
      console.log("Connected to server:", serverAddress);
      mainWindow.webContents.send("connection-status", { status: "connected" });
    });

    socket.on("connect_error", (error) => {
      console.error("Connection error:", error);
      mainWindow.webContents.send("connection-status", {
        status: "error",
        error: error.message,
      });
    });

    socket.on("disconnect", (reason) => {
      console.log("Disconnected:", reason);
      mainWindow.webContents.send("connection-status", {
        status: "disconnected",
        reason,
      });
    });

    socket.on("chat message", (data) => {
      mainWindow.webContents.send("new-message", data);
    });
  } catch (error) {
    console.error("Error creating socket:", error);
    mainWindow.webContents.send("connection-status", {
      status: "error",
      error: error.message,
    });
  }
}
