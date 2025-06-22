import { contextBridge, ipcRenderer } from 'electron';
import './chrome-api-polyfill';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Extension management
  getExtensions: () => ipcRenderer.invoke('get-extensions'),
  toggleExtension: (extensionId: string, enabled: boolean) => 
    ipcRenderer.invoke('toggle-extension', extensionId, enabled),
  
  // App info
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  
  // Window controls
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),
});

// Type definitions for the exposed API
declare global {
  interface Window {
    electronAPI: {
      getExtensions: () => Promise<any[]>;
      toggleExtension: (extensionId: string, enabled: boolean) => Promise<void>;
      getAppVersion: () => Promise<string>;
      minimizeWindow: () => Promise<void>;
      maximizeWindow: () => Promise<void>;
      closeWindow: () => Promise<void>;
    };
  }
}