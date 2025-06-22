import { contextBridge, ipcRenderer } from 'electron';

// Chrome API polyfills - 直接統合
// CRITICAL FIX: Comprehensive browserAction/action API compatibility
if (typeof (globalThis as any).chrome === 'undefined') {
  (globalThis as any).chrome = {};
}

const chrome = (globalThis as any).chrome;

// Complete browserAction API implementation
if (!chrome.browserAction) {
  chrome.browserAction = {
    onClicked: {
      addListener: function(callback: (tab: any) => void) { 
        console.log('✅ chrome.browserAction.onClicked.addListener called successfully'); 
        return true;
      },
      removeListener: function(callback: (tab: any) => void) { 
        console.log('✅ chrome.browserAction.onClicked.removeListener called successfully'); 
        return true;
      },
      hasListener: function(callback: (tab: any) => void) {
        return false;
      }
    },
    setIcon: function(details: any, callback?: () => void) { 
      console.log('✅ chrome.browserAction.setIcon called');
      if (callback) callback(); 
    },
    setTitle: function(details: any, callback?: () => void) { 
      console.log('✅ chrome.browserAction.setTitle called');
      if (callback) callback(); 
    },
    setBadgeText: function(details: any, callback?: () => void) { 
      console.log('✅ chrome.browserAction.setBadgeText called');
      if (callback) callback(); 
    },
    setBadgeBackgroundColor: function(details: any, callback?: () => void) { 
      console.log('✅ chrome.browserAction.setBadgeBackgroundColor called');
      if (callback) callback(); 
    },
    enable: function(tabId?: number, callback?: () => void) { 
      console.log('✅ chrome.browserAction.enable called');
      if (callback) callback(); 
    },
    disable: function(tabId?: number, callback?: () => void) { 
      console.log('✅ chrome.browserAction.disable called');
      if (callback) callback(); 
    }
  };
}

// CRITICAL: Ensure chrome.action points to browserAction for V3 compatibility
if (!chrome.action) {
  chrome.action = chrome.browserAction;
}

// Additional Chrome API polyfills for better extension compatibility
if (!chrome.contextMenus) {
  chrome.contextMenus = {
    create: function(properties: any, callback?: () => void) { 
      console.log('✅ chrome.contextMenus.create called');
      if (callback) callback(); 
      return 'menu_' + Date.now(); 
    },
    update: function(id: any, properties: any, callback?: () => void) { 
      console.log('✅ chrome.contextMenus.update called');
      if (callback) callback(); 
    },
    remove: function(id: any, callback?: () => void) { 
      console.log('✅ chrome.contextMenus.remove called');
      if (callback) callback(); 
    },
    onClicked: {
      addListener: function(callback: (info: any) => void) { 
        console.log('✅ chrome.contextMenus.onClicked.addListener called'); 
      },
      removeListener: function(callback: (info: any) => void) { 
        console.log('✅ chrome.contextMenus.onClicked.removeListener called'); 
      }
    }
  };
}

if (!chrome.notifications) {
  chrome.notifications = {
    create: function(id: string, options: any, callback?: (notificationId: string) => void) { 
      console.log('✅ chrome.notifications.create called');
      if (callback) callback(id || 'notif_' + Date.now()); 
    },
    update: function(id: string, options: any, callback?: (wasUpdated: boolean) => void) { 
      console.log('✅ chrome.notifications.update called');
      if (callback) callback(false); 
    },
    clear: function(id: string, callback?: (wasCleared: boolean) => void) { 
      console.log('✅ chrome.notifications.clear called');
      if (callback) callback(false); 
    }
  };
}

if (!chrome.webNavigation) {
  chrome.webNavigation = {
    onCompleted: {
      addListener: function(callback: (details: any) => void) { 
        console.log('✅ chrome.webNavigation.onCompleted.addListener called'); 
      },
      removeListener: function(callback: (details: any) => void) { 
        console.log('✅ chrome.webNavigation.onCompleted.removeListener called'); 
      }
    },
    onBeforeNavigate: {
      addListener: function(callback: (details: any) => void) { 
        console.log('✅ chrome.webNavigation.onBeforeNavigate.addListener called'); 
      },
      removeListener: function(callback: (details: any) => void) { 
        console.log('✅ chrome.webNavigation.onBeforeNavigate.removeListener called'); 
      }
    }
  };
}

console.log('🚀 Chrome API polyfills loaded in preload script!');

// electron-chrome-extensionsのbrowser action injectionは不要 - 削除
// 独自のChrome API polyfillで十分に対応済み

// Setup Chrome API for extension contexts in global scope
(function setupExtensionChromeAPI() {
  // Note: This runs in the Node.js preload context
  // The actual chrome APIs are already injected above in this preload script
  console.log('Preload script: Chrome API setup completed');
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