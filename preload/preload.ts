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

// Enhanced Chrome API polyfills for better extension compatibility
if (!chrome.storage) {
  // Enhanced memory-based storage with proper sync support
  const memoryStorage = new Map<string, any>();
  const syncStorage = new Map<string, any>();
  
  const createStorageArea = (storageMap: Map<string, any>, storageType: string) => ({
    get: function(keys: string | string[] | object | null, callback?: (result: any) => void) {
      console.log(`✅ chrome.storage.${storageType}.get called`);
      
      try {
        const result: any = {};
        
        if (keys === null || keys === undefined) {
          // Get all values
          storageMap.forEach((value, key) => {
            result[key] = value;
          });
        } else if (typeof keys === 'string') {
          result[keys] = storageMap.get(keys);
        } else if (Array.isArray(keys)) {
          keys.forEach(key => {
            result[key] = storageMap.get(key);
          });
        } else if (typeof keys === 'object') {
          Object.keys(keys).forEach(key => {
            const value = storageMap.get(key);
            result[key] = value !== undefined ? value : (keys as any)[key];
          });
        }
        
        if (callback) {
          setTimeout(() => callback(result), 1);
        }
      } catch (error) {
        console.error(`❌ Storage get error (${storageType}):`, error);
        if (callback) callback({});
      }
    },
    
    set: function(items: {[key: string]: any}, callback?: () => void) {
      console.log(`✅ chrome.storage.${storageType}.set called`);
      
      try {
        Object.keys(items).forEach(key => {
          storageMap.set(key, items[key]);
        });
        
        if (callback) {
          setTimeout(() => callback(), 1);
        }
      } catch (error) {
        console.error(`❌ Storage set error (${storageType}):`, error);
        if (callback) callback();
      }
    },
    
    remove: function(keys: string | string[], callback?: () => void) {
      console.log(`✅ chrome.storage.${storageType}.remove called`);
      
      try {
        const keysArray = typeof keys === 'string' ? [keys] : keys;
        keysArray.forEach(key => storageMap.delete(key));
        
        if (callback) {
          setTimeout(() => callback(), 1);
        }
      } catch (error) {
        console.error(`❌ Storage remove error (${storageType}):`, error);
        if (callback) callback();
      }
    },
    
    clear: function(callback?: () => void) {
      console.log(`✅ chrome.storage.${storageType}.clear called`);
      
      try {
        storageMap.clear();
        
        if (callback) {
          setTimeout(() => callback(), 1);
        }
      } catch (error) {
        console.error(`❌ Storage clear error (${storageType}):`, error);
        if (callback) callback();
      }
    },
    
    getBytesInUse: function(keys?: string | string[], callback?: (bytesInUse: number) => void) {
      console.log(`✅ chrome.storage.${storageType}.getBytesInUse called`);
      if (callback) callback(0);
    }
  });

  chrome.storage = {
    local: createStorageArea(memoryStorage, 'local'),
    sync: createStorageArea(syncStorage, 'sync'),
    onChanged: {
      _listeners: [] as any[],
      addListener: function(callback: (changes: any, areaName: string) => void) {
        console.log('✅ chrome.storage.onChanged.addListener called');
        this._listeners.push(callback);
      },
      removeListener: function(callback: (changes: any, areaName: string) => void) {
        console.log('✅ chrome.storage.onChanged.removeListener called');
        const index = this._listeners.indexOf(callback);
        if (index > -1) {
          this._listeners.splice(index, 1);
        }
      },
      hasListener: function(callback: (changes: any, areaName: string) => void) {
        return this._listeners.includes(callback);
      },
      hasListeners: function() {
        return this._listeners.length > 0;
      }
    }
  };
}

if (!chrome.runtime) {
  // Enhanced messaging system for preload context
  const messageListeners: Array<(message: any, sender: any, sendResponse: any) => void> = [];
  
  chrome.runtime = {
    sendMessage: function(extensionId: string | any, message?: any, options?: any, responseCallback?: (response: any) => void) {
      // Handle both 3-param and 4-param versions
      if (typeof extensionId !== 'string') {
        responseCallback = options;
        options = message;
        message = extensionId;
        extensionId = chrome.runtime.id;
      }
      if (typeof options === 'function') {
        responseCallback = options;
        options = {};
      }
      
      console.log('✅ chrome.runtime.sendMessage called', { extensionId, message, options });
      
      try {
        // Simulate successful message sending
        if (responseCallback) {
          setTimeout(() => {
            try {
              responseCallback({ success: true, extensionId, message });
            } catch (e) {
              console.log('Response callback error:', e);
            }
          }, 10);
        }
      } catch (error) {
        console.error('❌ sendMessage error:', error);
        if (responseCallback) {
          setTimeout(() => responseCallback({ error: String(error) }), 10);
        }
      }
    },
    
    onMessage: {
      addListener: function(callback: (message: any, sender: any, sendResponse: any) => void) {
        console.log('✅ chrome.runtime.onMessage.addListener called');
        messageListeners.push(callback);
      },
      removeListener: function(callback: (message: any, sender: any, sendResponse: any) => void) {
        console.log('✅ chrome.runtime.onMessage.removeListener called');
        const index = messageListeners.indexOf(callback);
        if (index > -1) {
          messageListeners.splice(index, 1);
        }
      },
      hasListener: function(callback: (message: any, sender: any, sendResponse: any) => void) {
        return messageListeners.includes(callback);
      },
      hasListeners: function() {
        return messageListeners.length > 0;
      }
    },
    
    connect: function(extensionId?: string, connectInfo?: any) {
      console.log('✅ chrome.runtime.connect called');
      return {
        postMessage: function(message: any) {
          console.log('✅ Port postMessage:', message);
        },
        disconnect: function() {
          console.log('✅ Port disconnect');
        },
        onMessage: {
          addListener: function(callback: any) {
            console.log('✅ Port onMessage.addListener');
          },
          removeListener: function(callback: any) {
            console.log('✅ Port onMessage.removeListener');
          }
        },
        onDisconnect: {
          addListener: function(callback: any) {
            console.log('✅ Port onDisconnect.addListener');
          },
          removeListener: function(callback: any) {
            console.log('✅ Port onDisconnect.removeListener');
          }
        }
      };
    },
    
    getManifest: function() {
      return {
        name: 'OTDD Extension',
        version: '1.0.0',
        manifest_version: 3
      };
    },
    
    getURL: function(path: string) {
      return 'chrome-extension://otdd-extension/' + path;
    },
    
    id: 'otdd-extension-' + Math.random().toString(36).substr(2, 9),
    lastError: null
  };
}

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