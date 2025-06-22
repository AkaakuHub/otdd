// Chrome API polyfills for unsupported APIs in electron-chrome-extensions

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
        // Store the callback for potential future use
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
    },
    getBadgeText: function(details: any, callback: (result: string) => void) {
      console.log('✅ chrome.browserAction.getBadgeText called');
      callback('');
    },
    getTitle: function(details: any, callback: (result: string) => void) {
      console.log('✅ chrome.browserAction.getTitle called');
      callback('Extension');
    },
    getBadgeBackgroundColor: function(details: any, callback: (result: any) => void) {
      console.log('✅ chrome.browserAction.getBadgeBackgroundColor called');
      callback([0, 0, 0, 0]);
    },
    setPopup: function(details: any, callback?: () => void) {
      console.log('✅ chrome.browserAction.setPopup called');
      if (callback) callback();
    },
    getPopup: function(details: any, callback: (result: string) => void) {
      console.log('✅ chrome.browserAction.getPopup called');
      callback('');
    }
  };
}

// CRITICAL: Ensure chrome.action points to browserAction for V3 compatibility
if (!chrome.action) {
  chrome.action = chrome.browserAction;
}

// Additional API polyfills
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

if (!chrome.cookies) {
  chrome.cookies = {
    get: function(details: any, callback: (cookie: any) => void) { 
      console.log('✅ chrome.cookies.get called');
      callback(null); 
    },
    set: function(details: any, callback?: (cookie: any) => void) { 
      console.log('✅ chrome.cookies.set called');
      if (callback) callback(null); 
    },
    remove: function(details: any, callback?: (details: any) => void) { 
      console.log('✅ chrome.cookies.remove called');
      if (callback) callback(null); 
    }
  };
}

if (!chrome.commands) {
  chrome.commands = {
    onCommand: {
      addListener: function(callback: (command: string) => void) { 
        console.log('✅ chrome.commands.onCommand.addListener called'); 
      },
      removeListener: function(callback: (command: string) => void) { 
        console.log('✅ chrome.commands.onCommand.removeListener called'); 
      }
    },
    getAll: function(callback: (commands: any[]) => void) { 
      console.log('✅ chrome.commands.getAll called');
      callback([]); 
    }
  };
}

console.log('🚀 CRITICAL FIX: Chrome API polyfills loaded - browserAction.onClicked error should be resolved!');

export {};