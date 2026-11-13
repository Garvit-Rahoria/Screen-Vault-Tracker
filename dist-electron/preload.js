"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("api", {
  // Authentication & Settings
  login: (credentials) => electron.ipcRenderer.invoke("auth:login", credentials),
  register: (credentials) => electron.ipcRenderer.invoke("auth:register", credentials),
  getUsers: () => electron.ipcRenderer.invoke("auth:get-users"),
  openLocalFolder: (filePath) => electron.ipcRenderer.invoke("shell:open-folder", filePath),
  getDiskInfo: () => electron.ipcRenderer.invoke("system:get-disk-info"),
  getSettings: () => electron.ipcRenderer.invoke("settings:get"),
  saveSettings: (settings) => electron.ipcRenderer.invoke("settings:save", settings),
  // Screenshot Operations
  captureNow: () => electron.ipcRenderer.invoke("screenshot:capture-now"),
  setTrackingStatus: (enabled) => electron.ipcRenderer.invoke("tracking:set-status", enabled),
  setInterval: (minutes) => electron.ipcRenderer.invoke("tracking:set-interval", minutes),
  // Cloud Storage Verification & Upload
  testStorageConnection: (config) => electron.ipcRenderer.invoke("storage:test", config),
  // Event Listeners for UI Updates
  onActivityLog: (callback) => {
    const handler = (_, data) => callback(data);
    electron.ipcRenderer.on("activity:log", handler);
    return () => electron.ipcRenderer.removeListener("activity:log", handler);
  },
  onStatusChange: (callback) => {
    const handler = (_, data) => callback(data);
    electron.ipcRenderer.on("tracking:status", handler);
    return () => electron.ipcRenderer.removeListener("tracking:status", handler);
  }
});
