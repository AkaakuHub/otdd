/**
 * Chrome API Polyfill for Content Scripts
 * 
 * This file provides a comprehensive Chrome API polyfill for extensions
 * running in content script mode within an Electron environment.
 * 
 * Uses webextension-polyfill as the base and extends it with additional
 * compatibility layers for older Chrome API patterns.
 */

/// <reference lib="dom" />

// Import the base polyfill with proper typing
import browser from 'webextension-polyfill';

// Get reference to global window object
const globalWindow = (typeof window !== 'undefined' ? window : globalThis) as any;

// Extend global window interface to include our APIs
declare global {
  interface Window {
    chrome: typeof chrome;
    browser: typeof browser;
    _otdd_messageSystem?: OTDDMessageSystem;
    _otdd_storage?: Map<string, any>;
    _otdd_syncStorage?: Map<string, any>;
    _otdd_browserAction_callbacks?: Array<(tab: any) => void>;
  }
}

interface OTDDMessageSystem {
  listeners: Map<string, Array<(message: any, sender: any, sendResponse: any) => void>>;
  broadcast: (message: any, source: string) => void;
  addListener: (callback: (message: any, sender: any, sendResponse: any) => void) => string;
}

class ChromeAPIPolyfill {
  private static instance: ChromeAPIPolyfill;
  private messageSystem!: OTDDMessageSystem;
  private localStorage!: Map<string, any>;
  private syncStorage!: Map<string, any>;

  constructor() {
    this.initializeMessageSystem();
    this.initializeStorage();
    this.setupChromeAPI();
    this.setupBrowserAPI();
  }

  public static getInstance(): ChromeAPIPolyfill {
    if (!ChromeAPIPolyfill.instance) {
      ChromeAPIPolyfill.instance = new ChromeAPIPolyfill();
    }
    return ChromeAPIPolyfill.instance;
  }

  private initializeMessageSystem(): void {
    this.messageSystem = {
      listeners: new Map(),
      broadcast: (message: any, source: string) => {
        this.messageSystem.listeners.forEach((callbacks) => {
          callbacks.forEach(callback => {
            try {
              callback(message, { id: source }, () => {});
            } catch (error) {
              console.warn('Message callback error:', error);
            }
          });
        });
      },
      addListener: (callback: (message: any, sender: any, sendResponse: any) => void) => {
        const id = Math.random().toString(36);
        if (!this.messageSystem.listeners.has('global')) {
          this.messageSystem.listeners.set('global', []);
        }
        this.messageSystem.listeners.get('global')?.push(callback);
        return id;
      }
    };

    globalWindow._otdd_messageSystem = this.messageSystem;
  }

  private initializeStorage(): void {
    this.localStorage = new Map();
    this.syncStorage = new Map();
    globalWindow._otdd_storage = this.localStorage;
    globalWindow._otdd_syncStorage = this.syncStorage;
  }

  private createStorageArea(storageMap: Map<string, any>, storageType: string) {
    return {
      get: (keys: string | string[] | object | null, callback?: (result: any) => void): Promise<any> => {
        console.log(`✅ POLYFILL: chrome.storage.${storageType}.get`, keys);
        
        return new Promise((resolve, reject) => {
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
            
            const finalResult = result;
            if (callback) callback(finalResult);
            resolve(finalResult);
          } catch (error) {
            console.error(`❌ Storage get error (${storageType}):`, error);
            const emptyResult = {};
            if (callback) callback(emptyResult);
            resolve(emptyResult);
          }
        });
      },

      set: (items: {[key: string]: any}, callback?: () => void): Promise<void> => {
        console.log(`✅ POLYFILL: chrome.storage.${storageType}.set`, items);
        
        return new Promise((resolve) => {
          try {
            Object.keys(items).forEach(key => {
              storageMap.set(key, items[key]);
            });
            
            // Trigger onChanged event
            if (globalWindow.chrome?.storage?.onChanged && (globalWindow.chrome.storage.onChanged as any)._listeners) {
              const changes: any = {};
              Object.keys(items).forEach(key => {
                changes[key] = { newValue: items[key] };
              });
              (globalWindow.chrome.storage.onChanged as any)._listeners.forEach((listener: any) => {
                try {
                  listener(changes, storageType);
                } catch (e) {
                  console.warn('Storage change listener error:', e);
                }
              });
            }
            
            if (callback) callback();
            resolve();
          } catch (error) {
            console.error(`❌ Storage set error (${storageType}):`, error);
            if (callback) callback();
            resolve();
          }
        });
      },

      remove: (keys: string | string[], callback?: () => void): Promise<void> => {
        console.log(`✅ POLYFILL: chrome.storage.${storageType}.remove`, keys);
        
        return new Promise((resolve) => {
          try {
            const keysArray = typeof keys === 'string' ? [keys] : keys;
            keysArray.forEach(key => storageMap.delete(key));
            
            if (callback) callback();
            resolve();
          } catch (error) {
            console.error(`❌ Storage remove error (${storageType}):`, error);
            if (callback) callback();
            resolve();
          }
        });
      },

      clear: (callback?: () => void): Promise<void> => {
        console.log(`✅ POLYFILL: chrome.storage.${storageType}.clear`);
        
        return new Promise((resolve) => {
          try {
            storageMap.clear();
            if (callback) callback();
            resolve();
          } catch (error) {
            console.error(`❌ Storage clear error (${storageType}):`, error);
            if (callback) callback();
            resolve();
          }
        });
      },

      getBytesInUse: (keys?: string | string[], callback?: (bytesInUse: number) => void): Promise<number> => {
        console.log(`✅ POLYFILL: chrome.storage.${storageType}.getBytesInUse`);
        
        return new Promise((resolve) => {
          const result = 0; // Simplified implementation
          if (callback) callback(result);
          resolve(result);
        });
      }
    };
  }

  private setupChromeAPI(): void {
    if (typeof globalWindow.chrome === 'undefined') {
      globalWindow.chrome = {} as any;
    }

    // Enhanced browser action API with proper event handling
    if (!globalWindow.chrome.browserAction) {
      const browserActionCallbacks: Array<(tab: any) => void> = [];
      globalWindow._otdd_browserAction_callbacks = browserActionCallbacks;

      globalWindow.chrome.browserAction = {
        onClicked: {
          addListener: (callback: (tab: any) => void) => {
            console.log('✅ POLYFILL: chrome.browserAction.onClicked.addListener');
            browserActionCallbacks.push(callback);
          },
          removeListener: (callback: (tab: any) => void) => {
            console.log('✅ POLYFILL: chrome.browserAction.onClicked.removeListener');
            const index = browserActionCallbacks.indexOf(callback);
            if (index > -1) {
              browserActionCallbacks.splice(index, 1);
            }
          },
          hasListener: (callback: (tab: any) => void) => {
            return browserActionCallbacks.includes(callback);
          },
          hasListeners: () => {
            return browserActionCallbacks.length > 0;
          }
        },
        setIcon: (details: any, callback?: () => void) => {
          console.log('✅ POLYFILL: chrome.browserAction.setIcon');
          if (callback) callback();
        },
        setTitle: (details: any, callback?: () => void) => {
          console.log('✅ POLYFILL: chrome.browserAction.setTitle');
          if (callback) callback();
        },
        setBadgeText: (details: any, callback?: () => void) => {
          console.log('✅ POLYFILL: chrome.browserAction.setBadgeText');
          if (callback) callback();
        },
        setBadgeBackgroundColor: (details: any, callback?: () => void) => {
          console.log('✅ POLYFILL: chrome.browserAction.setBadgeBackgroundColor');
          if (callback) callback();
        },
        enable: (tabId?: number, callback?: () => void) => {
          console.log('✅ POLYFILL: chrome.browserAction.enable');
          if (callback) callback();
        },
        disable: (tabId?: number, callback?: () => void) => {
          console.log('✅ POLYFILL: chrome.browserAction.disable');
          if (callback) callback();
        }
      } as any;
    }

    // Enhanced storage API
    if (!globalWindow.chrome.storage) {
      const onChangedListeners: Array<(changes: any, areaName: string) => void> = [];

      globalWindow.chrome.storage = {
        local: this.createStorageArea(this.localStorage, 'local'),
        sync: this.createStorageArea(this.syncStorage, 'sync'),
        onChanged: {
          addListener: (callback: (changes: any, areaName: string) => void) => {
            console.log('✅ POLYFILL: chrome.storage.onChanged.addListener');
            onChangedListeners.push(callback);
          },
          removeListener: (callback: (changes: any, areaName: string) => void) => {
            console.log('✅ POLYFILL: chrome.storage.onChanged.removeListener');
            const index = onChangedListeners.indexOf(callback);
            if (index > -1) {
              onChangedListeners.splice(index, 1);
            }
          },
          hasListener: (callback: (changes: any, areaName: string) => void) => {
            return onChangedListeners.includes(callback);
          },
          hasListeners: () => {
            return onChangedListeners.length > 0;
          },
          _listeners: onChangedListeners
        }
      } as any;
    }

    // Enhanced runtime API with proper messaging
    if (!globalWindow.chrome.runtime) {
      const messageListeners: Array<(message: any, sender: any, sendResponse: any) => void> = [];

      globalWindow.chrome.runtime = {
        sendMessage: (extensionIdOrMessage: string | any, messageOrOptions?: any, optionsOrCallback?: any, responseCallback?: (response: any) => void) => {
          // Handle different parameter patterns
          let finalExtensionId: string;
          let finalMessage: any;
          let finalCallback: ((response: any) => void) | undefined;

          if (typeof extensionIdOrMessage === 'string') {
            finalExtensionId = extensionIdOrMessage;
            finalMessage = messageOrOptions;
            finalCallback = typeof optionsOrCallback === 'function' ? optionsOrCallback : responseCallback;
          } else {
            finalExtensionId = 'otdd-extension-' + Math.random().toString(36).substr(2, 9);
            finalMessage = extensionIdOrMessage;
            finalCallback = typeof messageOrOptions === 'function' ? messageOrOptions : optionsOrCallback;
          }

          console.log('✅ POLYFILL: chrome.runtime.sendMessage', { extensionId: finalExtensionId, message: finalMessage });

          // Broadcast message
          if (this.messageSystem) {
            this.messageSystem.broadcast(finalMessage, finalExtensionId);
          }

          // Handle response
          if (finalCallback) {
            setTimeout(() => {
              try {
                finalCallback({ success: true, extensionId: finalExtensionId, message: finalMessage });
              } catch (e) {
                console.warn('Response callback error:', e);
              }
            }, 10);
          }
        },
        onMessage: {
          addListener: (callback: (message: any, sender: any, sendResponse: any) => void) => {
            console.log('✅ POLYFILL: chrome.runtime.onMessage.addListener');
            messageListeners.push(callback);
            if (this.messageSystem) {
              this.messageSystem.addListener(callback);
            }
          },
          removeListener: (callback: (message: any, sender: any, sendResponse: any) => void) => {
            console.log('✅ POLYFILL: chrome.runtime.onMessage.removeListener');
            const index = messageListeners.indexOf(callback);
            if (index > -1) {
              messageListeners.splice(index, 1);
            }
          },
          hasListener: (callback: (message: any, sender: any, sendResponse: any) => void) => {
            return messageListeners.includes(callback);
          },
          hasListeners: () => {
            return messageListeners.length > 0;
          }
        },
        connect: (extensionId?: string, connectInfo?: any) => {
          console.log('✅ POLYFILL: chrome.runtime.connect');
          return {
            postMessage: (message: any) => {
              console.log('✅ POLYFILL: Port.postMessage', message);
            },
            disconnect: () => {
              console.log('✅ POLYFILL: Port.disconnect');
            },
            onMessage: {
              addListener: (callback: any) => {
                console.log('✅ POLYFILL: Port.onMessage.addListener');
              },
              removeListener: (callback: any) => {
                console.log('✅ POLYFILL: Port.onMessage.removeListener');
              }
            },
            onDisconnect: {
              addListener: (callback: any) => {
                console.log('✅ POLYFILL: Port.onDisconnect.addListener');
              },
              removeListener: (callback: any) => {
                console.log('✅ POLYFILL: Port.onDisconnect.removeListener');
              }
            }
          };
        },
        getManifest: () => {
          return {
            name: 'OTDD Extension',
            version: '1.0.0',
            manifest_version: 3
          };
        },
        getURL: (path: string) => {
          return 'chrome-extension://otdd-extension/' + path;
        },
        id: 'otdd-extension-' + Math.random().toString(36).substr(2, 9),
        lastError: null
      } as any;
    }

    // Manifest V3 compatibility (chrome.action) - use any type to avoid strict typing issues
    if (!globalWindow.chrome.action) {
      globalWindow.chrome.action = globalWindow.chrome.browserAction as any;
    }

    // Additional Chrome APIs
    if (!globalWindow.chrome.tabs) {
      globalWindow.chrome.tabs = {
        query: (queryInfo: any, callback?: (tabs: any[]) => void) => {
          console.log('✅ POLYFILL: chrome.tabs.query');
          const result = [{ id: 1, url: globalWindow.location?.href || 'about:blank', active: true }];
          if (callback) callback(result);
          return Promise.resolve(result);
        },
        get: (tabId: number, callback?: (tab: any) => void) => {
          console.log('✅ POLYFILL: chrome.tabs.get');
          const result = { id: tabId, url: globalWindow.location?.href || 'about:blank', active: true };
          if (callback) callback(result);
          return Promise.resolve(result);
        },
        sendMessage: (tabId: number, message: any, options?: any, responseCallback?: (response: any) => void) => {
          console.log('✅ POLYFILL: chrome.tabs.sendMessage');
          const finalCallback = typeof options === 'function' ? options : responseCallback;
          if (finalCallback) {
            setTimeout(() => finalCallback({ success: true }), 10);
          }
          return Promise.resolve({ success: true });
        }
      } as any;
    }

    console.log('✅ Chrome API polyfill initialized');
    console.log('🎯 Available Chrome APIs:', Object.keys(globalWindow.chrome));
  }

  private setupBrowserAPI(): void {
    // Ensure browser API is available (webextension-polyfill should handle this)
    if (!globalWindow.browser) {
      globalWindow.browser = browser;
    }
    console.log('✅ Browser API (webextension-polyfill) initialized');
  }

  public initialize(): void {
    console.log('🎯 OTDD Chrome API polyfill initialization complete');
  }
}

// Initialize the polyfill
const polyfill = ChromeAPIPolyfill.getInstance();
polyfill.initialize();

// Export for potential future use
export default ChromeAPIPolyfill;
