"use strict";
const electron = require("electron");
const path = require("path");
const fs = require("fs");
const child_process = require("child_process");
const clientS3 = require("@aws-sdk/client-s3");
let mainWindow = null;
let timerId = null;
let lastExternalWindow = {
  appName: "Desktop / Workspace",
  processName: "explorer.exe"
};
let windowWatchId = null;
function isOwnProcessName(processName) {
  const name = processName.replace(/\.exe$/i, "").toLowerCase();
  const execBase = path.basename(process.execPath, path.extname(process.execPath)).toLowerCase();
  return name === "electron" || name === execBase || name.includes("screenvault") || name.includes("screen vault");
}
function formatWindowLabel(title, processName) {
  let name = title.trim();
  if (name.length > 48) name = name.substring(0, 45) + "...";
  if (name) return name;
  return processName.replace(/\.exe$/i, "");
}
function getActiveWindowDetails() {
  if (process.platform === "win32") {
    const scriptPath = path.join(electron.app.getPath("temp"), "screenvault-active-window.ps1");
    try {
      const script = `
$ErrorActionPreference = 'SilentlyContinue'
$selfPid = ${process.pid}
if (-not ([System.Management.Automation.PSTypeName]'FgWin').Type) {
Add-Type -TypeDefinition @"
using System;
using System.Text;
using System.Runtime.InteropServices;
public class FgWin {
  public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern bool IsIconic(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);
  [DllImport("user32.dll")] public static extern int GetWindowTextLength(IntPtr hWnd);
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint pid);
  [DllImport("user32.dll")] public static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);
}
"@
}

function Get-WinInfo([IntPtr]$hwnd) {
  if ($hwnd -eq [IntPtr]::Zero) { return $null }
  $pidVal = 0
  [void][FgWin]::GetWindowThreadProcessId($hwnd, [ref]$pidVal)
  if ($pidVal -eq 0 -or $pidVal -eq $selfPid) { return $null }
  $proc = Get-Process -Id $pidVal -ErrorAction SilentlyContinue
  if (-not $proc) { return $null }
  $pn = [string]$proc.ProcessName
  if ($pn -match '^(electron)$') { return $null }
  $len = [FgWin]::GetWindowTextLength($hwnd)
  if ($len -le 0) { return $null }
  $sb = New-Object System.Text.StringBuilder ($len + 1)
  [void][FgWin]::GetWindowText($hwnd, $sb, $sb.Capacity)
  $title = $sb.ToString().Trim()
  if (-not $title) { return $null }
  if ($title -match 'Screen Vault') { return $null }
  return @{ appName = $title; processName = ($pn + '.exe') }
}

$info = Get-WinInfo ([FgWin]::GetForegroundWindow())
if (-not $info) {
  $script:found = $null
  $cb = [FgWin+EnumWindowsProc] {
    param($h, $l)
    if (-not [FgWin]::IsWindowVisible($h)) { return $true }
    if ([FgWin]::IsIconic($h)) { return $true }
    $c = Get-WinInfo $h
    if ($c) { $script:found = $c; return $false }
    return $true
  }
  [void][FgWin]::EnumWindows($cb, [IntPtr]::Zero)
  $info = $script:found
}
if ($info) { $info | ConvertTo-Json -Compress }
`;
      fs.writeFileSync(scriptPath, script, "utf8");
      const output = child_process.execSync(
        `powershell -NoProfile -ExecutionPolicy Bypass -File "${scriptPath}"`,
        { timeout: 3e3, encoding: "utf8", windowsHide: true }
      ).trim();
      if (output) {
        const parsed = JSON.parse(output);
        if ((parsed == null ? void 0 : parsed.appName) && (parsed == null ? void 0 : parsed.processName) && !isOwnProcessName(String(parsed.processName))) {
          return {
            appName: formatWindowLabel(String(parsed.appName), String(parsed.processName)),
            processName: String(parsed.processName)
          };
        }
      }
    } catch (err) {
    }
  }
  return { ...lastExternalWindow };
}
function refreshExternalWindowWatch() {
  const details = getActiveWindowDetails();
  if ((details == null ? void 0 : details.processName) && !isOwnProcessName(details.processName)) {
    lastExternalWindow = details;
  }
}
const credentialsPath = path.join(electron.app.getPath("userData"), "user_credentials.json");
const DEFAULT_USERS = [
  { email: "admin@company.com", pass: "admin123" },
  { email: "demo@company.com", pass: "demo123" },
  { email: "user@company.com", pass: "user123" }
];
function loadCredentials() {
  try {
    if (fs.existsSync(credentialsPath)) {
      const data = JSON.parse(fs.readFileSync(credentialsPath, "utf8"));
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (err) {
    console.error("Failed to load credentials:", err);
  }
  saveCredentials(DEFAULT_USERS);
  return DEFAULT_USERS;
}
function saveCredentials(users) {
  try {
    fs.writeFileSync(credentialsPath, JSON.stringify(users, null, 2));
  } catch (err) {
    console.error("Failed to save credentials:", err);
  }
}
function getLocalCapturesDir() {
  const dir = path.join(electron.app.getPath("pictures"), "ScreenVaultCaptures");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}
const configPath = path.join(electron.app.getPath("userData"), "user_settings.json");
function loadSettings() {
  try {
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, "utf8"));
    }
  } catch (err) {
    console.error("Failed to load settings:", err);
  }
  return {
    isTracking: false,
    intervalMinutes: 3,
    storage: {
      provider: "mock-storage",
      endpoint: "",
      bucketName: "company-screen-vault",
      region: "us-east-1",
      accessKeyId: "",
      secretAccessKey: "",
      quality: 80
    },
    user: null
  };
}
function saveSettings(settings) {
  try {
    fs.writeFileSync(configPath, JSON.stringify(settings, null, 2));
  } catch (err) {
    console.error("Failed to save settings:", err);
  }
}
let appSettings = loadSettings();
function createWindow() {
  mainWindow = new electron.BrowserWindow({
    width: 1100,
    height: 750,
    minWidth: 360,
    minHeight: 520,
    title: "Screen Vault Tracker",
    icon: path.join(__dirname, "../src/assets/logo.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true
    },
    show: false,
    autoHideMenuBar: true
  });
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }
  mainWindow.once("ready-to-show", () => {
    mainWindow == null ? void 0 : mainWindow.show();
  });
}
async function captureAndUploadScreenshot(reason = "timer") {
  if (!mainWindow) return;
  const activeWin = { ...lastExternalWindow };
  const timestamp = /* @__PURE__ */ new Date();
  const captureId = timestamp.getTime();
  const dateStr = timestamp.toISOString().replace(/[:.]/g, "-");
  const filename = `screenshot_${dateStr}.jpg`;
  try {
    mainWindow.webContents.send("activity:log", {
      id: captureId,
      timestamp: timestamp.toLocaleTimeString(),
      status: "capturing",
      filename,
      sizeKb: 0,
      reason,
      appName: activeWin.appName,
      processName: activeWin.processName,
      message: "Capturing desktop screen..."
    });
    const primaryDisplay = electron.screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.size;
    const sources = await electron.desktopCapturer.getSources({
      types: ["screen"],
      thumbnailSize: { width, height }
    });
    if (!sources || sources.length === 0) {
      throw new Error("No screen sources detected");
    }
    const primarySource = sources[0];
    const image = primarySource.thumbnail;
    const jpegBuffer = image.toJPEG(appSettings.storage.quality || 80);
    const sizeKb = Math.round(jpegBuffer.length / 1024);
    const dataUrl = `data:image/jpeg;base64,${jpegBuffer.toString("base64")}`;
    const isDemoMode = appSettings.storage.provider === "mock-storage";
    if (isDemoMode) {
      const localDir = getLocalCapturesDir();
      const localFilePath = path.join(localDir, filename);
      fs.writeFileSync(localFilePath, jpegBuffer);
      mainWindow.webContents.send("activity:log", {
        id: captureId,
        timestamp: timestamp.toLocaleTimeString(),
        status: "success",
        filename,
        sizeKb,
        reason,
        appName: activeWin.appName,
        processName: activeWin.processName,
        previewUrl: dataUrl,
        localPath: localFilePath,
        destination: `Local PC (${localFilePath})`,
        message: `Saved locally on PC at: ${localFilePath}`
      });
    } else {
      const { accessKeyId, secretAccessKey, bucketName } = appSettings.storage;
      if (!accessKeyId || !secretAccessKey || !bucketName) {
        throw new Error("Database is not linked! Please configure and link your database credentials in Storage Config or switch to Demo Mode.");
      }
      mainWindow.webContents.send("activity:log", {
        id: captureId,
        timestamp: timestamp.toLocaleTimeString(),
        status: "uploading",
        filename,
        sizeKb,
        reason,
        appName: activeWin.appName,
        processName: activeWin.processName,
        previewUrl: dataUrl,
        message: `Uploading to linked database bucket "${bucketName}"...`
      });
      await uploadToCloudStorage(filename, jpegBuffer);
      mainWindow.webContents.send("activity:log", {
        id: captureId,
        timestamp: timestamp.toLocaleTimeString(),
        status: "success",
        filename,
        sizeKb,
        reason,
        appName: activeWin.appName,
        processName: activeWin.processName,
        previewUrl: dataUrl,
        destination: `Bucket (${bucketName})`,
        message: `Uploaded to database bucket "${bucketName}"`
      });
    }
  } catch (error) {
    console.error("Screenshot / Upload error:", error);
    mainWindow == null ? void 0 : mainWindow.webContents.send("activity:log", {
      id: captureId,
      timestamp: timestamp.toLocaleTimeString(),
      status: "error",
      filename,
      sizeKb: 0,
      reason,
      appName: activeWin.appName,
      processName: activeWin.processName,
      message: `Failed: ${error.message || error}`
    });
  }
}
async function uploadToCloudStorage(filename, buffer) {
  const { provider, endpoint, bucketName, region, accessKeyId, secretAccessKey } = appSettings.storage;
  if (!accessKeyId || !secretAccessKey) {
    throw new Error("Access Key and Secret Key are required to save to linked database.");
  }
  const s3Config = {
    region: region || "us-east-1",
    credentials: {
      accessKeyId,
      secretAccessKey
    }
  };
  if (endpoint) {
    s3Config.endpoint = endpoint;
    s3Config.forcePathStyle = true;
  }
  const s3Client = new clientS3.S3Client(s3Config);
  const uploadCommand = new clientS3.PutObjectCommand({
    Bucket: bucketName,
    Key: `screenshots/${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}/${filename}`,
    Body: buffer,
    ContentType: "image/jpeg"
  });
  await s3Client.send(uploadCommand);
}
function restartTimer() {
  if (timerId) clearInterval(timerId);
  if (appSettings.isTracking) {
    const intervalMs = Math.max(0.5, appSettings.intervalMinutes) * 60 * 1e3;
    timerId = setInterval(() => {
      captureAndUploadScreenshot("timer");
    }, intervalMs);
  }
}
electron.ipcMain.handle("auth:login", async (_, credentials) => {
  const { email, pass } = credentials;
  if (!email || !pass) {
    return { success: false, message: "Please enter both work email and password." };
  }
  const users = loadCredentials();
  const matchedUser = users.find(
    (u) => u.email.toLowerCase().trim() === email.toLowerCase().trim() && u.pass === pass
  );
  if (!matchedUser) {
    return {
      success: false,
      message: "Invalid credentials! Unauthorized login attempt. Please use valid credentials or register a new user."
    };
  }
  appSettings.user = {
    email: matchedUser.email,
    token: "jwt_token_valid_" + Date.now()
  };
  saveSettings(appSettings);
  return { success: true, user: appSettings.user };
});
electron.ipcMain.handle("auth:register", async (_, credentials) => {
  const { email, pass } = credentials;
  if (!email || !pass) {
    return { success: false, message: "Please enter both email and password to register." };
  }
  const users = loadCredentials();
  const existing = users.find((u) => u.email.toLowerCase().trim() === email.toLowerCase().trim());
  if (existing) {
    return { success: false, message: "An account with this email already exists!" };
  }
  const newUser = { email: email.trim(), pass };
  users.push(newUser);
  saveCredentials(users);
  return { success: true, message: "Account registered successfully! You can now log in." };
});
electron.ipcMain.handle("auth:get-users", async () => {
  const users = loadCredentials();
  return users.map((u) => ({ email: u.email }));
});
electron.ipcMain.handle("shell:open-folder", async (_, itemPath) => {
  const defaultDir = getLocalCapturesDir();
  if (itemPath && fs.existsSync(itemPath)) {
    electron.shell.showItemInFolder(itemPath);
  } else {
    electron.shell.openPath(defaultDir);
  }
  return { success: true, path: defaultDir };
});
electron.ipcMain.handle("system:get-disk-info", async () => {
  try {
    const stats = fs.statfsSync ? fs.statfsSync(getLocalCapturesDir()) : null;
    if (stats) {
      const freeBytes = Number(stats.bavail || stats.bfree) * Number(stats.bsize);
      const totalBytes = Number(stats.blocks) * Number(stats.bsize);
      const freeGb = Math.round(freeBytes / (1024 * 1024 * 1024));
      const totalGb = Math.round(totalBytes / (1024 * 1024 * 1024));
      return { freeGb, totalGb };
    }
  } catch (err) {
    console.error("Disk info error:", err);
  }
  return { freeGb: 125, totalGb: 237 };
});
electron.ipcMain.handle("settings:get", () => appSettings);
electron.ipcMain.handle("settings:save", (_, newSettings) => {
  appSettings = { ...appSettings, ...newSettings };
  saveSettings(appSettings);
  restartTimer();
  return { success: true };
});
electron.ipcMain.handle("tracking:set-status", (_, enabled) => {
  appSettings.isTracking = enabled;
  saveSettings(appSettings);
  restartTimer();
  mainWindow == null ? void 0 : mainWindow.webContents.send("tracking:status", enabled);
  return { isTracking: enabled };
});
electron.ipcMain.handle("tracking:set-interval", (_, minutes) => {
  appSettings.intervalMinutes = minutes;
  saveSettings(appSettings);
  restartTimer();
  return { intervalMinutes: minutes };
});
electron.ipcMain.handle("screenshot:capture-now", async () => {
  await captureAndUploadScreenshot("manual");
  return { success: true };
});
electron.ipcMain.handle("storage:test", async (_, config) => {
  try {
    if (!config.accessKeyId || !config.secretAccessKey) {
      return { success: false, message: "Access Key and Secret Key are required to link database." };
    }
    const s3Config = {
      region: config.region || "us-east-1",
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey
      }
    };
    if (config.endpoint) {
      s3Config.endpoint = config.endpoint;
      s3Config.forcePathStyle = true;
    }
    const s3 = new clientS3.S3Client(s3Config);
    return { success: true, message: `Connected successfully to linked database bucket "${config.bucketName}"` };
  } catch (err) {
    return { success: false, message: err.message || "Database connection test failed" };
  }
});
electron.app.whenReady().then(() => {
  createWindow();
  restartTimer();
  refreshExternalWindowWatch();
  if (windowWatchId) clearInterval(windowWatchId);
  windowWatchId = setInterval(refreshExternalWindowWatch, 800);
});
electron.app.on("before-quit", () => {
  if (windowWatchId) {
    clearInterval(windowWatchId);
    windowWatchId = null;
  }
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});
