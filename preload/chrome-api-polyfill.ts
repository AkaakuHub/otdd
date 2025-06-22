// Chrome API polyfills for unsupported APIs in electron-chrome-extensions

// Polyfill for chrome.contextMenus
if (typeof (globalThis as any).chrome !== 'undefined' && !(globalThis as any).chrome.contextMenus) {
  ((globalThis as any).chrome as any).contextMenus = {
    create: (properties: any, callback?: () => void) => {
      console.warn('chrome.contextMenus.create is not supported in Electron');
      if (callback) callback();
    },
    update: (id: string | number, properties: any, callback?: () => void) => {
      console.warn('chrome.contextMenus.update is not supported in Electron');
      if (callback) callback();
    },
    remove: (id: string | number, callback?: () => void) => {
      console.warn('chrome.contextMenus.remove is not supported in Electron');
      if (callback) callback();
    },
    onClicked: {
      addListener: (callback: (info: any) => void) => {
        console.warn('chrome.contextMenus.onClicked is not supported in Electron');
      },
      removeListener: (callback: (info: any) => void) => {
        console.warn('chrome.contextMenus.onClicked removeListener is not supported in Electron');
      }
    }
  };
}

// Polyfill for chrome.notifications
if (typeof (globalThis as any).chrome !== 'undefined' && !(globalThis as any).chrome.notifications) {
  ((globalThis as any).chrome as any).notifications = {
    create: (notificationId: string, options: any, callback?: (notificationId: string) => void) => {
      console.warn('chrome.notifications.create is not supported in Electron');
      if (callback) callback(notificationId);
    },
    update: (notificationId: string, options: any, callback?: (wasUpdated: boolean) => void) => {
      console.warn('chrome.notifications.update is not supported in Electron');
      if (callback) callback(false);
    },
    clear: (notificationId: string, callback?: (wasCleared: boolean) => void) => {
      console.warn('chrome.notifications.clear is not supported in Electron');
      if (callback) callback(false);
    }
  };
}

// Polyfill for chrome.webNavigation
if (typeof (globalThis as any).chrome !== 'undefined' && !(globalThis as any).chrome.webNavigation) {
  ((globalThis as any).chrome as any).webNavigation = {
    onCompleted: {
      addListener: (callback: (details: any) => void) => {
        console.warn('chrome.webNavigation.onCompleted is not supported in Electron');
      },
      removeListener: (callback: (details: any) => void) => {
        console.warn('chrome.webNavigation.onCompleted removeListener is not supported in Electron');
      }
    },
    onBeforeNavigate: {
      addListener: (callback: (details: any) => void) => {
        console.warn('chrome.webNavigation.onBeforeNavigate is not supported in Electron');
      },
      removeListener: (callback: (details: any) => void) => {
        console.warn('chrome.webNavigation.onBeforeNavigate removeListener is not supported in Electron');
      }
    }
  };
}

// Polyfill for chrome.cookies
if (typeof (globalThis as any).chrome !== 'undefined' && !(globalThis as any).chrome.cookies) {
  ((globalThis as any).chrome as any).cookies = {
    get: (details: any, callback: (cookie: any) => void) => {
      console.warn('chrome.cookies.get is not supported in Electron');
      callback(null);
    },
    set: (details: any, callback?: (cookie: any) => void) => {
      console.warn('chrome.cookies.set is not supported in Electron');
      if (callback) callback(null);
    },
    remove: (details: any, callback?: (details: any) => void) => {
      console.warn('chrome.cookies.remove is not supported in Electron');
      if (callback) callback(null);
    }
  };
}

// Polyfill for chrome.browserAction (Manifest V2)
if (typeof (globalThis as any).chrome !== 'undefined' && !(globalThis as any).chrome.browserAction) {
  ((globalThis as any).chrome as any).browserAction = {
    onClicked: {
      addListener: (callback: (tab: any) => void) => {
        console.warn('chrome.browserAction.onClicked is not supported in Electron');
      },
      removeListener: (callback: (tab: any) => void) => {
        console.warn('chrome.browserAction.onClicked removeListener is not supported in Electron');
      }
    },
    setIcon: (details: any, callback?: () => void) => {
      console.warn('chrome.browserAction.setIcon is not supported in Electron');
      if (callback) callback();
    },
    setTitle: (details: any, callback?: () => void) => {
      console.warn('chrome.browserAction.setTitle is not supported in Electron');
      if (callback) callback();
    },
    setBadgeText: (details: any, callback?: () => void) => {
      console.warn('chrome.browserAction.setBadgeText is not supported in Electron');
      if (callback) callback();
    },
    setBadgeBackgroundColor: (details: any, callback?: () => void) => {
      console.warn('chrome.browserAction.setBadgeBackgroundColor is not supported in Electron');
      if (callback) callback();
    },
    enable: (tabId?: number, callback?: () => void) => {
      console.warn('chrome.browserAction.enable is not supported in Electron');
      if (callback) callback();
    },
    disable: (tabId?: number, callback?: () => void) => {
      console.warn('chrome.browserAction.disable is not supported in Electron');
      if (callback) callback();
    }
  };
}

// Polyfill for chrome.action (Manifest V3) - forward to browserAction for V2 compatibility
if (typeof (globalThis as any).chrome !== 'undefined' && !(globalThis as any).chrome.action) {
  ((globalThis as any).chrome as any).action = ((globalThis as any).chrome as any).browserAction;
}

// Polyfill for chrome.commands
if (typeof (globalThis as any).chrome !== 'undefined' && !(globalThis as any).chrome.commands) {
  ((globalThis as any).chrome as any).commands = {
    onCommand: {
      addListener: (callback: (command: string) => void) => {
        console.warn('chrome.commands.onCommand is not supported in Electron');
      },
      removeListener: (callback: (command: string) => void) => {
        console.warn('chrome.commands.onCommand removeListener is not supported in Electron');
      }
    },
    getAll: (callback: (commands: any[]) => void) => {
      console.warn('chrome.commands.getAll is not supported in Electron');
      callback([]);
    }
  };
}

// Polyfill for chrome.declarativeContent
if (typeof (globalThis as any).chrome !== 'undefined' && !(globalThis as any).chrome.declarativeContent) {
  ((globalThis as any).chrome as any).declarativeContent = {
    onPageChanged: {
      removeRules: (ruleIds?: string[], callback?: () => void) => {
        console.warn('chrome.declarativeContent.onPageChanged.removeRules is not supported in Electron');
        if (callback) callback();
      },
      addRules: (rules: any[], callback?: () => void) => {
        console.warn('chrome.declarativeContent.onPageChanged.addRules is not supported in Electron');
        if (callback) callback();
      }
    },
    PageStateMatcher: function(properties: any) {
      console.warn('chrome.declarativeContent.PageStateMatcher is not supported in Electron');
      return {};
    },
    ShowPageAction: function() {
      console.warn('chrome.declarativeContent.ShowPageAction is not supported in Electron');
      return {};
    }
  };
}

export {};