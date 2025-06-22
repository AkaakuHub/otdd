import { contextBridge, ipcRenderer } from 'electron';
import './chrome-api-polyfill';

// Import electron-chrome-extensions browser action injection
try {
  // @ts-ignore - dynamic import for electron-chrome-extensions
  const { injectBrowserAction } = require('electron-chrome-extensions/dist/browser-action');
  
  // Inject browser action support immediately
  if (typeof injectBrowserAction === 'function') {
    injectBrowserAction();
    console.log('Browser action injected successfully');
  }
} catch (error) {
  console.warn('Failed to inject browser action:', error);
}

// Setup Chrome API for extension contexts in global scope
(function setupExtensionChromeAPI() {
  // Note: This runs in the Node.js preload context
  // The actual chrome APIs will be injected by chrome-api-polyfill.ts in the renderer
  console.log('Preload script: Chrome API setup will be handled by polyfill');
})();

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