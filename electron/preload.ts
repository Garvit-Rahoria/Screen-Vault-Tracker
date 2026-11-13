import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  // Authentication & Settings
  login: (credentials: { email: string; pass: string }) => 
    ipcRenderer.invoke('auth:login', credentials),
  
  register: (credentials: { email: string; pass: string }) =>
    ipcRenderer.invoke('auth:register', credentials),

  getUsers: () =>
    ipcRenderer.invoke('auth:get-users'),

  openLocalFolder: (filePath?: string) =>
    ipcRenderer.invoke('shell:open-folder', filePath),

  getDiskInfo: () =>
    ipcRenderer.invoke('system:get-disk-info'),

  getSettings: () => 
    ipcRenderer.invoke('settings:get'),

  saveSettings: (settings: any) => 
    ipcRenderer.invoke('settings:save', settings),

  // Screenshot Operations
  captureNow: () => 
    ipcRenderer.invoke('screenshot:capture-now'),

  setTrackingStatus: (enabled: boolean) => 
    ipcRenderer.invoke('tracking:set-status', enabled),

  setInterval: (minutes: number) => 
    ipcRenderer.invoke('tracking:set-interval', minutes),

  // Cloud Storage Verification & Upload
  testStorageConnection: (config: any) => 
    ipcRenderer.invoke('storage:test', config),

  // Event Listeners for UI Updates
  onActivityLog: (callback: (log: any) => void) => {
    const handler = (_: any, data: any) => callback(data);
    ipcRenderer.on('activity:log', handler);
    return () => ipcRenderer.removeListener('activity:log', handler);
  },

  onStatusChange: (callback: (status: any) => void) => {
    const handler = (_: any, data: any) => callback(data);
    ipcRenderer.on('tracking:status', handler);
    return () => ipcRenderer.removeListener('tracking:status', handler);
  }
});
