import { app, BrowserWindow, ipcMain } from "electron";
import path from "node:path";

const createWindow = () => {
  const iconPath = app.isPackaged
    ? path.join(process.resourcesPath, "icons", "icon.png")
    : path.join(__dirname, "../../resources/icons/icon.png");

  const win = new BrowserWindow({
    width: 1200,
    height: 760,
    minWidth: 980,
    minHeight: 640,
    backgroundColor: "#0b0c10",
    icon: iconPath,
    frame: false,
    titleBarStyle: "hidden",
    titleBarOverlay: {
      color: "#00000000",
      symbolColor: "#f5f6f7",
      height: 32
    },
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL ?? "http://localhost:5173";
  if (app.isPackaged) {
    win.loadFile(path.join(__dirname, "../renderer/index.html"));
  } else {
    win.loadURL(devUrl);
    win.webContents.openDevTools({ mode: "detach" });
  }

  win.on("maximize", () => win.webContents.send("window:maximized", true));
  win.on("unmaximize", () => win.webContents.send("window:maximized", false));
};

app.whenReady().then(() => {
  if (process.platform === "darwin") {
    const iconPath = app.isPackaged
      ? path.join(process.resourcesPath, "icons", "icon.png")
      : path.join(__dirname, "../../resources/icons/icon.png");
    app.dock.setIcon(iconPath).catch(() => {});
  }
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

ipcMain.on("window:minimize", () => {
  const win = BrowserWindow.getFocusedWindow();
  win?.minimize();
});

ipcMain.on("window:toggle-maximize", () => {
  const win = BrowserWindow.getFocusedWindow();
  if (!win) return;
  if (win.isMaximized()) {
    win.unmaximize();
  } else {
    win.maximize();
  }
});

ipcMain.on("window:close", () => {
  const win = BrowserWindow.getFocusedWindow();
  win?.close();
});

ipcMain.handle("window:isMaximized", () => {
  const win = BrowserWindow.getFocusedWindow();
  return win?.isMaximized() ?? false;
});

ipcMain.on("window:titlebar", (event, options) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win || !options) return;
  try {
    win.setTitleBarOverlay(options);
  } catch {
    // Ignore when unsupported.
  }
});
