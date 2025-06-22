"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    // Extension management
    getExtensions: () => electron_1.ipcRenderer.invoke('get-extensions'),
    toggleExtension: (extensionId, enabled) => electron_1.ipcRenderer.invoke('toggle-extension', extensionId, enabled),
    // App info
    getAppVersion: () => electron_1.ipcRenderer.invoke('get-app-version'),
    // Window controls
    minimizeWindow: () => electron_1.ipcRenderer.invoke('minimize-window'),
    maximizeWindow: () => electron_1.ipcRenderer.invoke('maximize-window'),
    closeWindow: () => electron_1.ipcRenderer.invoke('close-window'),
});
//# sourceMappingURL=preload.js.map