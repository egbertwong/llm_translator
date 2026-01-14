import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  minimize: () => ipcRenderer.send("window:minimize"),
  toggleMaximize: () => ipcRenderer.send("window:toggle-maximize"),
  close: () => ipcRenderer.send("window:close"),
  isMaximized: () => ipcRenderer.invoke("window:isMaximized"),
  setTitleBarOverlay: (options: { color: string; symbolColor: string; height: number }) =>
    ipcRenderer.send("window:titlebar", options),
  loadSettings: () => ipcRenderer.invoke("storage:load-settings"),
  saveSettings: (settings: unknown) => ipcRenderer.invoke("storage:save-settings", settings),
  loadHistory: () => ipcRenderer.invoke("storage:load-history"),
  saveHistory: (items: unknown[]) => ipcRenderer.invoke("storage:save-history", items),
  onMaximizedChange: (handler: (maximized: boolean) => void) => {
    const listener = (_: unknown, maximized: boolean) => handler(maximized);
    ipcRenderer.on("window:maximized", listener);
    return () => ipcRenderer.removeListener("window:maximized", listener);
  }
});
