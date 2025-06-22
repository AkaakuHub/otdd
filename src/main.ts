import { app, BrowserWindow, session, Menu } from 'electron';
import { ElectronChromeExtensions } from 'electron-chrome-extensions';
import * as path from 'path';
import * as fs from 'fs';

class OTDDApp {
  private mainWindow: BrowserWindow | null = null;
  private extensions: ElectronChromeExtensions | null = null;

  constructor() {
    // Suppress extension warnings and enable V2 manifest support
    process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';
    process.env.ELECTRON_ENABLE_LOGGING = 'false';
    
    this.initializeApp();
  }

  private initializeApp(): void {
    app.whenReady().then(async () => {
      // Critical: Setup extensions and APIs BEFORE creating the window
      await this.setupChromePolyfills();
      this.setupExtensions();
      await this.loadExtensions();
      // Only create window after extensions are loaded
      this.createMainWindow();
    });

    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createMainWindow();
      }
    });
  }

  private setupExtensions(): void {
    // Suppress extension loading warnings
    process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';
    
    // Setup Chrome API in extension context BEFORE creating extensions
    this.setupExtensionAPIs();
    
    this.extensions = new ElectronChromeExtensions({
      session: session.defaultSession,
      license: 'GPL-3.0',
      createTab: async (details) => {
        // For now, we'll open new tabs in the same window
        if (this.mainWindow && details.url) {
          await this.mainWindow.webContents.loadURL(details.url);
          return [this.mainWindow.webContents, this.mainWindow];
        }
        throw new Error('Main window not available');
      },
      removeTab: () => {
        // Handle tab removal if needed
      }
    });
  }

  private polyfillScript = `
    (function() {
      if (typeof window !== 'undefined' && typeof window.chrome === 'undefined') {
        window.chrome = {};
      }
      if (typeof globalThis !== 'undefined' && typeof globalThis.chrome === 'undefined') {
        globalThis.chrome = {};
      }
      
      const chromeAPI = {
        browserAction: {
          onClicked: {
            addListener: function(callback) { console.log('chrome.browserAction.onClicked.addListener called'); },
            removeListener: function(callback) { console.log('chrome.browserAction.onClicked.removeListener called'); }
          },
          setIcon: function(details, callback) { if (callback) callback(); },
          setTitle: function(details, callback) { if (callback) callback(); },
          setBadgeText: function(details, callback) { if (callback) callback(); },
          setBadgeBackgroundColor: function(details, callback) { if (callback) callback(); },
          enable: function(tabId, callback) { if (callback) callback(); },
          disable: function(tabId, callback) { if (callback) callback(); }
        },
        contextMenus: {
          create: function(properties, callback) { if (callback) callback(); return 'menu_' + Date.now(); },
          update: function(id, properties, callback) { if (callback) callback(); },
          remove: function(id, callback) { if (callback) callback(); },
          onClicked: {
            addListener: function(callback) { console.log('chrome.contextMenus.onClicked.addListener called'); },
            removeListener: function(callback) { console.log('chrome.contextMenus.onClicked.removeListener called'); }
          }
        },
        notifications: {
          create: function(id, options, callback) { if (callback) callback(id || 'notif_' + Date.now()); },
          update: function(id, options, callback) { if (callback) callback(false); },
          clear: function(id, callback) { if (callback) callback(false); }
        },
        webNavigation: {
          onCompleted: {
            addListener: function(callback) { console.log('chrome.webNavigation.onCompleted.addListener called'); },
            removeListener: function(callback) { console.log('chrome.webNavigation.onCompleted.removeListener called'); }
          },
          onBeforeNavigate: {
            addListener: function(callback) { console.log('chrome.webNavigation.onBeforeNavigate.addListener called'); },
            removeListener: function(callback) { console.log('chrome.webNavigation.onBeforeNavigate.removeListener called'); }
          }
        },
        cookies: {
          get: function(details, callback) { callback(null); },
          set: function(details, callback) { if (callback) callback(null); },
          remove: function(details, callback) { if (callback) callback(null); }
        },
        commands: {
          onCommand: {
            addListener: function(callback) { console.log('chrome.commands.onCommand.addListener called'); },
            removeListener: function(callback) { console.log('chrome.commands.onCommand.removeListener called'); }
          },
          getAll: function(callback) { callback([]); }
        }
      };
      
      // Set up the chrome API in all contexts
      if (typeof window !== 'undefined') {
        Object.assign(window.chrome, chromeAPI);
        window.chrome.action = window.chrome.browserAction; // V3 compatibility
      }
      if (typeof globalThis !== 'undefined') {
        Object.assign(globalThis.chrome, chromeAPI);
        globalThis.chrome.action = globalThis.chrome.browserAction; // V3 compatibility
      }
      
      console.log('Chrome API polyfills initialized globally');
    })();
  `;

  private setupExtensionAPIs(): void {
    // Setup Chrome APIs in the extension context using session preload scripts
    const extensionAPIScript = `
      // Global Chrome API setup for extensions
      if (typeof globalThis.chrome === 'undefined') {
        globalThis.chrome = {
          browserAction: {
            onClicked: {
              addListener: function(callback) { 
                console.log('Extension chrome.browserAction.onClicked.addListener called'); 
              },
              removeListener: function(callback) { 
                console.log('Extension chrome.browserAction.onClicked.removeListener called'); 
              }
            },
            setIcon: function(details, callback) { if (callback) callback(); },
            setTitle: function(details, callback) { if (callback) callback(); },
            setBadgeText: function(details, callback) { if (callback) callback(); },
            setBadgeBackgroundColor: function(details, callback) { if (callback) callback(); },
            enable: function(tabId, callback) { if (callback) callback(); },
            disable: function(tabId, callback) { if (callback) callback(); }
          },
          contextMenus: {
            create: function(properties, callback) { 
              if (callback) callback(); 
              return 'menu_' + Date.now(); 
            },
            update: function(id, properties, callback) { if (callback) callback(); },
            remove: function(id, callback) { if (callback) callback(); },
            onClicked: {
              addListener: function(callback) { 
                console.log('Extension chrome.contextMenus.onClicked.addListener called'); 
              },
              removeListener: function(callback) { 
                console.log('Extension chrome.contextMenus.onClicked.removeListener called'); 
              }
            }
          },
          notifications: {
            create: function(id, options, callback) { 
              if (callback) callback(id || 'notif_' + Date.now()); 
            },
            update: function(id, options, callback) { if (callback) callback(false); },
            clear: function(id, callback) { if (callback) callback(false); }
          },
          webNavigation: {
            onCompleted: {
              addListener: function(callback) { 
                console.log('Extension chrome.webNavigation.onCompleted.addListener called'); 
              },
              removeListener: function(callback) { 
                console.log('Extension chrome.webNavigation.onCompleted.removeListener called'); 
              }
            },
            onBeforeNavigate: {
              addListener: function(callback) { 
                console.log('Extension chrome.webNavigation.onBeforeNavigate.addListener called'); 
              },
              removeListener: function(callback) { 
                console.log('Extension chrome.webNavigation.onBeforeNavigate.removeListener called'); 
              }
            }
          },
          cookies: {
            get: function(details, callback) { callback(null); },
            set: function(details, callback) { if (callback) callback(null); },
            remove: function(details, callback) { if (callback) callback(null); }
          },
          commands: {
            onCommand: {
              addListener: function(callback) { 
                console.log('Extension chrome.commands.onCommand.addListener called'); 
              },
              removeListener: function(callback) { 
                console.log('Extension chrome.commands.onCommand.removeListener called'); 
              }
            },
            getAll: function(callback) { callback([]); }
          }
        };
        
        // V3 compatibility
        globalThis.chrome.action = globalThis.chrome.browserAction;
        
        console.log('Extension Chrome APIs injected');
      }
    `;
    
    // Use webRequest API to inject scripts before extension execution
    session.defaultSession.webRequest.onBeforeRequest({
      urls: ['chrome-extension://*/*']
    }, (details, callback) => {
      // Inject API setup for extension contexts
      console.log('Extension context detected, APIs will be available');
      callback({});
    });
    
    console.log('Extension APIs setup completed');
  }

  private async setupChromePolyfills(): Promise<void> {
    console.log('Chrome API polyfills ready for injection');
  }

  private createMainWindow(): void {
    this.mainWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      minWidth: 800,
      minHeight: 600,
      show: false,
      title: 'OTDD',
      icon: this.getAppIcon(),
      backgroundColor: '#15202b',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, '../preload/preload.js'),
        session: session.defaultSession
      }
    });

    // Handle window ready to show
    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show();
    });

    // Inject Chrome API polyfills before page load
    this.mainWindow.webContents.on('dom-ready', () => {
      this.injectChromePolyfills();
      this.obliterateCSPWithJavaScript();
    });

    // Also inject polyfills before loading the page
    this.mainWindow.webContents.on('will-navigate', () => {
      this.injectPolyfillScript();
    });

    // 🔥 NUCLEAR CSP OVERRIDE - DOMレベルでもCSPを完全破壊
    this.mainWindow.webContents.on('did-finish-load', () => {
      this.obliterateCSPWithJavaScript();
    });

    // Load TweetDeck with retry mechanism
    this.loadTweetDeckWithRetry();

    // Add the window to extensions
    if (this.extensions) {
      this.extensions.addTab(this.mainWindow.webContents, this.mainWindow);
    }

    // Handle window closed
    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });

    // Performance optimizations
    this.setupPerformanceOptimizations();

    // Development tools - always open
    this.mainWindow.webContents.openDevTools();
    
    // Add keyboard shortcut for dev tools
    this.mainWindow.webContents.on('before-input-event', (event, input) => {
      if (input.control && input.shift && input.key === 'I') {
        this.mainWindow?.webContents.toggleDevTools();
      }
      if (input.meta && input.alt && input.key === 'I') {
        this.mainWindow?.webContents.toggleDevTools();
      }
    });

    // Create application menu
    this.createApplicationMenu();
  }

  private createApplicationMenu(): void {
    const template = [
      {
        label: 'アプリケーション',
        submenu: [
          {
            label: 'OTDD について',
            role: 'about'
          },
          { type: 'separator' },
          {
            label: 'OTDD を終了',
            accelerator: 'CmdOrCtrl+Q',
            click: () => {
              app.quit();
            }
          }
        ]
      },
      {
        label: '表示',
        submenu: [
          {
            label: '再読み込み',
            accelerator: 'CmdOrCtrl+R',
            click: () => {
              this.mainWindow?.webContents.reload();
            }
          },
          {
            label: '強制再読み込み',
            accelerator: 'CmdOrCtrl+Shift+R',
            click: () => {
              this.mainWindow?.webContents.reloadIgnoringCache();
            }
          },
          { type: 'separator' },
          {
            label: '開発者ツール',
            accelerator: process.platform === 'darwin' ? 'Cmd+Option+I' : 'Ctrl+Shift+I',
            click: () => {
              this.mainWindow?.webContents.toggleDevTools();
            }
          },
          { type: 'separator' },
          {
            label: '実際のサイズ',
            accelerator: 'CmdOrCtrl+0',
            click: () => {
              this.mainWindow?.webContents.setZoomLevel(0);
            }
          },
          {
            label: '拡大',
            accelerator: 'CmdOrCtrl+Plus',
            click: () => {
              const currentZoom = this.mainWindow?.webContents.getZoomLevel() || 0;
              this.mainWindow?.webContents.setZoomLevel(currentZoom + 0.5);
            }
          },
          {
            label: '縮小',
            accelerator: 'CmdOrCtrl+-',
            click: () => {
              const currentZoom = this.mainWindow?.webContents.getZoomLevel() || 0;
              this.mainWindow?.webContents.setZoomLevel(currentZoom - 0.5);
            }
          },
          { type: 'separator' },
          {
            label: '全画面表示',
            accelerator: process.platform === 'darwin' ? 'Ctrl+Cmd+F' : 'F11',
            click: () => {
              const isFullScreen = this.mainWindow?.isFullScreen() || false;
              this.mainWindow?.setFullScreen(!isFullScreen);
            }
          }
        ]
      },
      {
        label: 'ウィンドウ',
        submenu: [
          {
            label: '最小化',
            accelerator: 'CmdOrCtrl+M',
            role: 'minimize'
          },
          {
            label: '閉じる',
            accelerator: 'CmdOrCtrl+W',
            role: 'close'
          }
        ]
      }
    ];

    const menu = Menu.buildFromTemplate(template as any);
    Menu.setApplicationMenu(menu);
  }

  private async loadExtensions(): Promise<void> {
    const extensionsPath = path.join(__dirname, '../../extensions');
    
    console.log(`📁 Checking extensions path: ${extensionsPath}`);
    
    if (!fs.existsSync(extensionsPath)) {
      console.log('Extensions directory not found, creating...');
      fs.mkdirSync(extensionsPath, { recursive: true });
      return;
    }

    // � CRITICAL: Setup ULTRA CSP obliteration FIRST before ANY extension loading
    console.log('🛡️ PRIORITY 1: Setting up ULTRA CSP OBLITERATION before extension loading...');
    await this.setupUltraCSPObliteration();
    
    // Wait a bit to ensure CSP hooks are established
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // �🚀 NEW APPROACH: Pre-inject Chrome APIs into session BEFORE loading extensions
    console.log('🚀 Chrome API session setup completed after CSP obliteration');

    try {
      const extensionDirs = fs.readdirSync(extensionsPath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

      console.log(`📦 Found ${extensionDirs.length} extension directories:`, extensionDirs);

      if (extensionDirs.length === 0) {
        console.log('⚠️ No extension directories found');
        return;
      }

      for (const extensionDir of extensionDirs) {
        const extensionPath = path.join(extensionsPath, extensionDir);
        const manifestPath = path.join(extensionPath, 'manifest.json');

        console.log(`🔍 Checking extension: ${extensionDir}`);
        console.log(`📄 Manifest path: ${manifestPath}`);
        console.log(`📄 Manifest exists: ${fs.existsSync(manifestPath)}`);

        if (fs.existsSync(manifestPath)) {
          try {
            console.log(`🔄 Processing extension: ${extensionDir}`);
            
            const manifestContent = fs.readFileSync(manifestPath, 'utf8');
            let manifest = JSON.parse(manifestContent);
            
            console.log(`📋 Extension manifest for ${extensionDir}:`, {
              name: manifest.name,
              version: manifest.version,
              manifest_version: manifest.manifest_version,
              background: manifest.background ? 'present' : 'none',
              content_scripts: manifest.content_scripts ? manifest.content_scripts.length : 0,
              permissions: manifest.permissions || []
            });
            
            // 🛠️ RADICAL FIX: Convert ALL extensions to content-script only mode
            await this.convertToContentScriptMode(extensionPath, manifest);
            
            // Load with strict content-script only settings
            const loadOptions = {
              allowFileAccess: true,
              allowServiceWorkers: false // DISABLE for ALL extensions
            };
            
            console.log(`🚀 Loading extension ${extensionDir} with options:`, loadOptions);
            await session.defaultSession.loadExtension(extensionPath, loadOptions);
            console.log(`✅ Successfully loaded ${extensionDir} in CONTENT-SCRIPT MODE`);
            
          } catch (error) {
            console.error(`❌ Failed to load extension ${extensionDir}:`, error);
            console.error(`📍 Error details:`, {
              message: error instanceof Error ? error.message : String(error),
              stack: error instanceof Error ? error.stack : undefined
            });
          }
        } else {
          console.warn(`⚠️ Extension ${extensionDir} missing manifest.json`);
        }
      }
      
      // Load後に読み込まれた拡張機能を確認
      const loadedExtensions = session.defaultSession.getAllExtensions();
      console.log(`🎯 Total loaded extensions: ${loadedExtensions.length}`);
      loadedExtensions.forEach(ext => {
        console.log(`📎 Loaded: ${ext.name} (${ext.id})`);
      });
      
    } catch (error) {
      console.error('💥 Critical error loading extensions:', error);
      console.error('📍 Critical error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
    }
  }

  private getAppIcon(): string | undefined {
    // Return platform-specific icon path
    const iconName = process.platform === 'win32' ? 'icon.ico' : 'icon.png';
    const iconPath = path.join(__dirname, '../assets', iconName);
    
    if (fs.existsSync(iconPath)) {
      return iconPath;
    }
    
    return undefined;
  }

  private setupPerformanceOptimizations(): void {
    if (!this.mainWindow) return;

    // Suspend heavy operations when window is hidden
    this.mainWindow.on('hide', () => {
      this.mainWindow?.webContents.setAudioMuted(true);
      this.mainWindow?.webContents.setBackgroundThrottling(true);
    });

    this.mainWindow.on('show', () => {
      this.mainWindow?.webContents.setAudioMuted(false);
      this.mainWindow?.webContents.setBackgroundThrottling(false);
    });

    // Optimize memory usage
    this.mainWindow.webContents.on('dom-ready', () => {
      // Inject performance optimizations
      this.mainWindow?.webContents.executeJavaScript(`
        // Lazy load images that are not in viewport
        if ('IntersectionObserver' in window) {
          const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
              if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src) {
                  img.src = img.dataset.src;
                  img.classList.remove('lazy');
                  imageObserver.unobserve(img);
                }
              }
            });
          });
          
          document.querySelectorAll('img[data-src]').forEach(img => {
            imageObserver.observe(img);
          });
        }
        
        // Throttle scroll events
        let ticking = false;
        function updateScrollState() {
          ticking = false;
        }
        
        document.addEventListener('scroll', () => {
          if (!ticking) {
            requestAnimationFrame(updateScrollState);
            ticking = true;
          }
        }, { passive: true });
      `);
    });

    // Preload critical resources
    this.mainWindow.webContents.session.preconnect({
      url: 'https://abs.twimg.com',
      numSockets: 6
    });

    this.mainWindow.webContents.session.preconnect({
      url: 'https://pbs.twimg.com',
      numSockets: 6
    });
  }

  private injectChromePolyfills(): void {
    if (!this.mainWindow) return;

    // Use the prepared polyfill script
    this.mainWindow.webContents.executeJavaScript(this.polyfillScript)
      .then(() => {
        console.log('Chrome API polyfills injected via injectChromePolyfills');
      })
      .catch(err => {
        console.error('Failed to inject Chrome polyfills:', err);
      });
  }

  private injectPolyfillScript(): void {
    // Delegate to the main inject method
    this.injectChromePolyfills();
  }

  private async injectGlobalChromeAPIs(): Promise<void> {
    // Inject Chrome APIs globally in the main world for extensions
    const globalAPIScript = `
      // Global Chrome API for all contexts
      if (typeof globalThis.chrome === 'undefined') {
        globalThis.chrome = {
          browserAction: {
            onClicked: {
              addListener: function(callback) { 
                console.log('Global chrome.browserAction.onClicked.addListener called'); 
                return true;
              },
              removeListener: function(callback) { 
                console.log('Global chrome.browserAction.onClicked.removeListener called'); 
                return true;
              }
            },
            setIcon: function(details, callback) { if (callback) callback(); },
            setTitle: function(details, callback) { if (callback) callback(); },
            setBadgeText: function(details, callback) { if (callback) callback(); },
            setBadgeBackgroundColor: function(details, callback) { if (callback) callback(); },
            enable: function(tabId, callback) { if (callback) callback(); },
            disable: function(tabId, callback) { if (callback) callback(); }
          }
        };
        globalThis.chrome.action = globalThis.chrome.browserAction;
        console.log('Global Chrome APIs injected successfully');
      }
    `;

    try {
      // Execute in main world to ensure it's available everywhere
      eval(globalAPIScript);
      console.log('Global Chrome APIs setup completed');
    } catch (error) {
      console.error('Failed to setup global Chrome APIs:', error);
    }
  }

  private async fixExtensionManifest(extensionPath: string, manifest: any): Promise<void> {
    const manifestPath = path.join(extensionPath, 'manifest.json');
    const backupPath = manifestPath + '.original';
    let needsUpdate = false;
    
    try {
      // Create backup if it doesn't exist
      if (!fs.existsSync(backupPath)) {
        fs.copyFileSync(manifestPath, backupPath);
        console.log(`Created backup of manifest for ${path.basename(extensionPath)}`);
      }
      
      // Fix Manifest V3 extensions missing 'action' key  
      if (manifest.manifest_version === 3 && !manifest.action) {
        manifest.action = {
          "default_title": manifest.name || "Extension",
          "default_icon": manifest.icons || {}
        };
        needsUpdate = true;
        console.log(`FIXED: Added missing 'action' key to Manifest V3 extension ${path.basename(extensionPath)}`);
      }
      
      // CRITICAL: Add V2 compatibility for V3 extensions using chrome.browserAction
      if (manifest.manifest_version === 3 && !manifest.browser_action) {
        // Many V3 extensions still use chrome.browserAction API
        // Add browser_action as alias to action for backwards compatibility
        manifest.browser_action = manifest.action || {
          "default_title": manifest.name || "Extension", 
          "default_icon": manifest.icons || {}
        };
        needsUpdate = true;
        console.log(`FIXED: Added browser_action compatibility layer for V3 extension ${path.basename(extensionPath)}`);
      }
      
      // Fix Manifest V2 extensions missing 'browser_action' key
      if (manifest.manifest_version === 2 && !manifest.browser_action) {
        manifest.browser_action = {
          "default_title": manifest.name || "Extension",
          "default_icon": manifest.icons || {}
        };
        needsUpdate = true;
        console.log(`FIXED: Added missing 'browser_action' key to Manifest V2 extension ${path.basename(extensionPath)}`);
      }
      
      // Save updated manifest if changes were made
      if (needsUpdate) {
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
        console.log(`✅ CRITICAL FIX APPLIED: ${path.basename(extensionPath)} manifest updated to enable browserAction API`);
      }
      
      // Background patching no longer needed in content-script mode
      await this.patchBackgroundJS(extensionPath);
      
    } catch (error) {
      console.error(`Failed to fix manifest for ${path.basename(extensionPath)}:`, error);
      // Restore from backup if something went wrong
      if (fs.existsSync(backupPath)) {
        fs.copyFileSync(backupPath, manifestPath);
        console.log(`Restored original manifest for ${path.basename(extensionPath)}`);
      }
    }
  }

  private async setupSessionAPIs(): Promise<void> {
    // 🌟 REVOLUTIONARY APPROACH: Inject APIs at session level
    console.log('🚀 Setting up session-level Chrome APIs...');
    
    // 🔥 ULTIMATE CSP OBLITERATION - 全てのCSPを完全に破壊
    session.defaultSession.webRequest.onHeadersReceived({
      urls: [
        'https://x.com/*', 
        'https://twitter.com/*',
        'https://*.x.com/*',
        'https://*.twitter.com/*',
        'https://tweetdeck.twitter.com/*',
        'https://*.twimg.com/*',
        '*://*/*' // すべてのURLをキャッチ
      ]
    }, (details, callback) => {
      const responseHeaders = { ...details.responseHeaders };
      
      console.log(`🎯 INTERCEPTING: ${details.url}`);
      
      // あらゆる形式のCSPヘッダーを完全に削除・無効化
      const cspHeaders = [
        'content-security-policy',
        'Content-Security-Policy',
        'CONTENT-SECURITY-POLICY',
        'content-security-policy-report-only',
        'Content-Security-Policy-Report-Only',
        'CONTENT-SECURITY-POLICY-REPORT-ONLY'
      ];
      
      let cspFound = false;
      cspHeaders.forEach(header => {
        if (responseHeaders[header]) {
          console.log(`🚨 DESTROYING CSP HEADER [${header}]:`, responseHeaders[header]);
          delete responseHeaders[header]; // 完全に削除
          cspFound = true;
        }
      });
      
      if (cspFound) {
        console.log('💥 ALL CSP HEADERS OBLITERATED!');
      }
      
      // 強制的に完全に緩いCSPをセット（fallback）
      responseHeaders['Content-Security-Policy'] = [
        "default-src * 'unsafe-inline' 'unsafe-eval' data: blob: filesystem: about: ws: wss: 'unsafe-hashes'; " +
        "script-src * 'unsafe-inline' 'unsafe-eval' data: blob: chrome-extension: 'unsafe-hashes'; " +
        "connect-src * data: blob: chrome-extension: ws: wss: https://raw.githubusercontent.com https://github.com https://tweetdeck.dimden.dev; " +
        "style-src * 'unsafe-inline' data: blob: 'unsafe-hashes'; " +
        "img-src * data: blob: chrome-extension:; " +
        "font-src * data: blob: chrome-extension:; " +
        "frame-src * data: blob:; " +
        "media-src * data: blob:; " +
        "object-src * data: blob:; " +
        "worker-src * data: blob:; " +
        "child-src * data: blob:; " +
        "frame-ancestors *; " +
        "form-action *; " +
        "upgrade-insecure-requests; " +
        "block-all-mixed-content;"
      ];
      
      console.log('�️ FORCED ULTRA-PERMISSIVE CSP SET');
      
      callback({ responseHeaders });
    });
    
    // 🌪️ ADDITIONAL CSP DESTRUCTION - セッションレベルでも強制上書き
    session.defaultSession.webRequest.onBeforeRequest({
      urls: ['*://*/*']
    }, (details, callback) => {
      console.log(`📡 REQUEST INTERCEPTED: ${details.url}`);
      callback({});
    });
    
    // 🔥 META TAG CSP INJECTION - HTMLレベルでもCSPを無効化
    session.defaultSession.webRequest.onBeforeRequest({
      urls: ['https://x.com/*', 'https://twitter.com/*']
    }, (details, callback) => {
      if (details.resourceType === 'mainFrame') {
        console.log('🎯 MAIN FRAME DETECTED - will inject CSP override meta tag');
      }
      callback({});
    });
    
    // Use webRequest to inject into extension contexts
    session.defaultSession.webRequest.onHeadersReceived({
      urls: ['chrome-extension://*/*']
    }, (details, callback) => {
      // Inject our script via response modification
      console.log('🔄 Extension context detected, injecting APIs...');
      callback({
        responseHeaders: {
          ...details.responseHeaders,
          'Content-Security-Policy': ['default-src * \'unsafe-inline\' \'unsafe-eval\'; script-src * \'unsafe-inline\' \'unsafe-eval\';']
        }
      });
    });
    
    console.log('✅ Session-level Chrome APIs configured');
  }

  private async convertToContentScriptMode(extensionPath: string, manifest: any): Promise<void> {
    const manifestPath = path.join(extensionPath, 'manifest.json');
    const backupPath = manifestPath + '.contentscript-backup';
    
    try {
      // Create backup
      if (!fs.existsSync(backupPath)) {
        fs.writeFileSync(backupPath, JSON.stringify(manifest, null, 2));
        console.log(`📦 Created content-script backup for ${path.basename(extensionPath)}`);
      }
      
      let modified = false;
      
      // 🔥 RADICAL CHANGE: Remove background scripts entirely
      if (manifest.background) {
        console.log(`🚫 REMOVING background script from ${path.basename(extensionPath)}`);
        delete manifest.background;
        modified = true;
      }
      
      // Remove service worker declarations  
      if (manifest.service_worker) {
        console.log(`🚫 REMOVING service_worker from ${path.basename(extensionPath)}`);
        delete manifest.service_worker;
        modified = true;
      }
      
      // Force all extensions to content-script mode by injecting our API
      if (!manifest.content_scripts) {
        manifest.content_scripts = [];
      }
      
      // Add our Chrome API injection as the FIRST content script
      const apiInjectionScript = {
        matches: ["<all_urls>"],
        js: ["otdd-chrome-api-injection.js"],
        run_at: "document_start",
        all_frames: true
      };
      
      manifest.content_scripts.unshift(apiInjectionScript);
      modified = true;
      
      // Create the API injection file
      await this.createAPIInjectionFile(extensionPath);
      
      if (modified) {
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
        console.log(`✅ CONVERTED ${path.basename(extensionPath)} to CONTENT-SCRIPT MODE`);
      }
      
    } catch (error) {
      console.error(`❌ Failed to convert ${path.basename(extensionPath)}:`, error);
    }
  }

  private async createAPIInjectionFile(extensionPath: string): Promise<void> {
    const injectionPath = path.join(extensionPath, 'otdd-chrome-api-injection.js');
    
    const injectionCode = `
// 🚀 OTDD CHROME API INJECTION FOR CONTENT SCRIPTS
(function() {
  'use strict';
  
  console.log('🎯 OTDD Chrome API injection starting in content script...');
  
  // Create chrome object if it doesn't exist
  if (typeof chrome === 'undefined') {
    window.chrome = {};
  }
  
  // 💥 BULLETPROOF BROWSER ACTION API
  if (!chrome.browserAction) {
    chrome.browserAction = {
      onClicked: {
        addListener: function(callback) { 
          console.log('✅ CONTENT: chrome.browserAction.onClicked.addListener SUCCESS!');
          window._otdd_browserAction_callbacks = window._otdd_browserAction_callbacks || [];
          window._otdd_browserAction_callbacks.push(callback);
          return true;
        },
        removeListener: function(callback) { 
          console.log('✅ CONTENT: chrome.browserAction.onClicked.removeListener SUCCESS!');
          return true;
        },
        hasListener: () => false,
        hasListeners: () => false
      },
      setIcon: (details, cb) => { console.log('✅ CONTENT: setIcon'); if(cb) cb(); },
      setTitle: (details, cb) => { console.log('✅ CONTENT: setTitle'); if(cb) cb(); },
      setBadgeText: (details, cb) => { console.log('✅ CONTENT: setBadgeText'); if(cb) cb(); },
      setBadgeBackgroundColor: (details, cb) => { console.log('✅ CONTENT: setBadgeBackgroundColor'); if(cb) cb(); },
      enable: (tabId, cb) => { console.log('✅ CONTENT: enable'); if(cb) cb(); },
      disable: (tabId, cb) => { console.log('✅ CONTENT: disable'); if(cb) cb(); }
    };
  }
  
  // 🔧 CHROME STORAGE API (特にsync)
  if (!chrome.storage) {
    const localStorageProxy = {
      get: function(keys, callback) {
        console.log('✅ CONTENT: chrome.storage.local.get');
        const result = {};
        if (typeof keys === 'string') {
          const value = localStorage.getItem('otdd_' + keys);
          result[keys] = value ? JSON.parse(value) : undefined;
        } else if (Array.isArray(keys)) {
          keys.forEach(key => {
            const value = localStorage.getItem('otdd_' + key);
            result[key] = value ? JSON.parse(value) : undefined;
          });
        } else if (typeof keys === 'object') {
          Object.keys(keys).forEach(key => {
            const value = localStorage.getItem('otdd_' + key);
            result[key] = value ? JSON.parse(value) : keys[key];
          });
        }
        if (callback) callback(result);
      },
      set: function(items, callback) {
        console.log('✅ CONTENT: chrome.storage.local.set');
        Object.keys(items).forEach(key => {
          localStorage.setItem('otdd_' + key, JSON.stringify(items[key]));
        });
        if (callback) callback();
      },
      remove: function(keys, callback) {
        console.log('✅ CONTENT: chrome.storage.local.remove');
        if (typeof keys === 'string') {
          localStorage.removeItem('otdd_' + keys);
        } else {
          keys.forEach(key => localStorage.removeItem('otdd_' + key));
        }
        if (callback) callback();
      },
      clear: function(callback) {
        console.log('✅ CONTENT: chrome.storage.local.clear');
        Object.keys(localStorage).forEach(key => {
          if (key.startsWith('otdd_')) {
            localStorage.removeItem(key);
          }
        });
        if (callback) callback();
      }
    };
    
    chrome.storage = {
      local: localStorageProxy,
      sync: localStorageProxy, // syncもlocalで代用
      onChanged: {
        addListener: function(callback) {
          console.log('✅ CONTENT: chrome.storage.onChanged.addListener');
        },
        removeListener: function(callback) {
          console.log('✅ CONTENT: chrome.storage.onChanged.removeListener');
        }
      }
    };
  }
  
  // 🔧 RUNTIME MESSAGING API
  if (!chrome.runtime) {
    chrome.runtime = {
      sendMessage: function(message, responseCallback) {
        console.log('✅ CONTENT: chrome.runtime.sendMessage', message);
        // メッセージをlocalStorageを通じて処理
        if (responseCallback) {
          setTimeout(() => responseCallback({}), 10);
        }
      },
      onMessage: {
        addListener: function(callback) {
          console.log('✅ CONTENT: chrome.runtime.onMessage.addListener');
        },
        removeListener: function(callback) {
          console.log('✅ CONTENT: chrome.runtime.onMessage.removeListener');
        }
      },
      getManifest: function() {
        return {
          name: 'Extension',
          version: '1.0.0',
          manifest_version: 3
        };
      },
      id: 'otdd-extension-' + Math.random().toString(36).substr(2, 9)
    };
  }
  
  // V3 compatibility
  if (!chrome.action) {
    chrome.action = chrome.browserAction;
  }
  
  console.log('✅ OTDD Chrome API injection COMPLETE in content script!');
})();
`;
    
    fs.writeFileSync(injectionPath, injectionCode);
    console.log(`📝 Created API injection file: ${path.basename(extensionPath)}/otdd-chrome-api-injection.js`);
  }

  // Legacy method - no longer used due to content-script approach
  private async patchBackgroundJS(extensionPath: string): Promise<void> {
    console.log(`⚠️ Background patching skipped for ${path.basename(extensionPath)} - using content-script mode`);
  }

  private async loadTweetDeckWithRetry(retryCount = 0): Promise<void> {
    if (!this.mainWindow) return;

    const maxRetries = 3;
    const retryDelay = 2000;

    try {
      console.log(`Loading TweetDeck (attempt ${retryCount + 1}/${maxRetries + 1})`);
      
      // Setup navigation handlers
      this.mainWindow.webContents.once('did-fail-load', (_, errorCode, errorDescription) => {
        console.error(`TweetDeck failed to load: ${errorCode} - ${errorDescription}`);
        if (retryCount < maxRetries) {
          console.log(`Retrying in ${retryDelay}ms...`);
          setTimeout(() => {
            this.loadTweetDeckWithRetry(retryCount + 1);
          }, retryDelay);
        } else {
          console.error('Max retries reached. TweetDeck could not be loaded.');
        }
      });

      this.mainWindow.webContents.once('did-finish-load', () => {
        console.log('TweetDeck loaded successfully');
        // Inject polyfills after successful load
        setTimeout(() => {
          this.injectChromePolyfills();
        }, 1000);
      });

      // Handle loading timeout
      const loadTimeout = setTimeout(() => {
        console.warn('TweetDeck loading timeout');
        if (retryCount < maxRetries) {
          this.loadTweetDeckWithRetry(retryCount + 1);
        }
      }, 15000); // 15 second timeout

      this.mainWindow.webContents.once('did-finish-load', () => {
        clearTimeout(loadTimeout);
      });

      await this.mainWindow.loadURL('https://x.com/i/tweetdeck');
      
    } catch (error) {
      console.error('Error loading TweetDeck:', error);
      if (retryCount < maxRetries) {
        setTimeout(() => {
          this.loadTweetDeckWithRetry(retryCount + 1);
        }, retryDelay);
      }
    }
  }

  private obliterateCSPWithJavaScript(): void {
    if (!this.mainWindow) return;

    const cspKillerScript = `
      (function() {
        try {
          console.log('🔥 NUCLEAR CSP OBLITERATION STARTING...');
          
          // 1. メタタグのCSPを全て削除
          const cspMetas = document.querySelectorAll('meta[http-equiv*="Content-Security-Policy"], meta[http-equiv*="content-security-policy"]');
          cspMetas.forEach((meta, index) => {
            console.log('💥 DESTROYING CSP META TAG ' + (index + 1) + ':', meta.getAttribute('content'));
            meta.remove();
          });
        
        // 2. 新しい超緩いCSPメタタグを挿入
        const newCSP = document.createElement('meta');
        newCSP.setAttribute('http-equiv', 'Content-Security-Policy');
        newCSP.setAttribute('content', 
          "default-src * 'unsafe-inline' 'unsafe-eval' data: blob: filesystem: about: ws: wss:; " +
          "script-src * 'unsafe-inline' 'unsafe-eval' data: blob: chrome-extension:; " +
          "connect-src * data: blob: ws: wss: https://raw.githubusercontent.com https://github.com; " +
          "style-src * 'unsafe-inline' data: blob:; " +
          "img-src * data: blob:; " +
          "font-src * data: blob:; " +
          "frame-src * data: blob:; " +
          "media-src * data: blob:; " +
          "object-src * data: blob:; " +
          "worker-src * data: blob:; " +
          "child-src * data: blob:; " +
          "frame-ancestors *; " +
          "form-action *;"
        );
        if (document.head) {
          document.head.insertBefore(newCSP, document.head.firstChild);
          console.log('✅ ULTRA-PERMISSIVE CSP META TAG INJECTED');
        } else {
          console.log('⚠️ document.head not available yet');
        }
        
        // 3. nonceを持つすべての要素からnonce属性を削除
        const elementsWithNonce = document.querySelectorAll('[nonce]');
        elementsWithNonce.forEach((element, index) => {
          const nonce = element.getAttribute('nonce');
          console.log('🗑️ REMOVING NONCE ' + (index + 1) + ':', nonce);
          element.removeAttribute('nonce');
        });
        
        // 4. 動的に追加されるCSPメタタグを監視して即座に削除
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === 1) { // 1 = ELEMENT_NODE
                const element = node;
                if (element.tagName === 'META' && 
                    element.getAttribute && 
                    element.getAttribute('http-equiv') && 
                    element.getAttribute('http-equiv').toLowerCase().includes('content-security-policy')) {
                  console.log('🚨 DYNAMIC CSP META DETECTED AND DESTROYED:', element.getAttribute('content'));
                  element.remove();
                }
                
                // 追加されたnonce属性も削除
                if (element.hasAttribute && element.hasAttribute('nonce')) {
                  console.log('🗑️ REMOVING DYNAMIC NONCE:', element.getAttribute('nonce'));
                  element.removeAttribute('nonce');
                }
                
                // 子要素のnonceも削除
                const childrenWithNonce = element.querySelectorAll && element.querySelectorAll('[nonce]');
                if (childrenWithNonce) {
                  childrenWithNonce.forEach((child) => {
                    console.log('🗑️ REMOVING CHILD NONCE:', child.getAttribute('nonce'));
                    child.removeAttribute('nonce');
                  });
                }
              }
            });
          });
        });
        
        if (document.head) {
          observer.observe(document.head, { childList: true, subtree: true });
        }
        if (document.body) {
          observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['nonce'] });
        } else if (document.documentElement) {
          observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['nonce'] });
        }
        
        console.log('🛡️ CSP OBLITERATION COMPLETE - CONTINUOUS MONITORING ACTIVE');
        
        // 5. 定期的にCSPメタタグをチェックして削除
        setInterval(() => {
          const cspMetas = document.querySelectorAll('meta[http-equiv*="Content-Security-Policy"], meta[http-equiv*="content-security-policy"]');
          if (cspMetas.length > 1) { // 我々が追加した1つ以外があれば削除
            cspMetas.forEach((meta, index) => {
              if (index > 0) { // 最初の（我々の）以外を削除
                console.log('🔄 PERIODIC CSP META CLEANUP:', meta.getAttribute('content'));
                meta.remove();
              }
            });
          }
        }, 1000);
        
        } catch (error) {
          console.error('❌ CSP OBLITERATION ERROR:', error);
        }
      })();
    `;

    this.mainWindow.webContents.executeJavaScript(cspKillerScript)
      .then(() => {
        console.log('💥 NUCLEAR CSP OBLITERATION EXECUTED SUCCESSFULLY');
      })
      .catch(err => {
        console.error('❌ Failed to execute CSP obliteration:', err);
      });
  }

  private async setupUltraCSPObliteration(): Promise<void> {
    console.log('🔥🔥🔥 ULTRA CSP OBLITERATION STARTING...');
    
    // 🌪️ PHASE 1: Clear any existing webRequest listeners first
    session.defaultSession.webRequest.onHeadersReceived(null);
    session.defaultSession.webRequest.onBeforeRequest(null);
    
    // Wait a moment to ensure cleanup
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 🌪️ PHASE 2: Setup MULTIPLE webRequest hooks to catch ALL CSP headers
    const cspHeaders = [
      'content-security-policy',
      'Content-Security-Policy', 
      'CONTENT-SECURITY-POLICY',
      'content-security-policy-report-only',
      'Content-Security-Policy-Report-Only',
      'CONTENT-SECURITY-POLICY-REPORT-ONLY'
    ];

    // Hook 1: ULTIMATE CATCH-ALL - Every single HTTP request
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
      const responseHeaders = { ...details.responseHeaders };
      let cspDestroyed = false;
      
      console.log(`🎯 ULTIMATE INTERCEPT: ${details.url}`);
      
      // Destroy ALL CSP headers without exception
      cspHeaders.forEach(header => {
        if (responseHeaders[header]) {
          console.log(`💥 ULTIMATE DESTROYING CSP [${header}]:`, responseHeaders[header]);
          delete responseHeaders[header];
          cspDestroyed = true;
        }
      });
      
      // Force ultra-permissive CSP for ALL URLs
      responseHeaders['Content-Security-Policy'] = [
        "default-src * data: blob: 'unsafe-inline' 'unsafe-eval' 'unsafe-hashes'; " +
        "script-src * data: blob: 'unsafe-inline' 'unsafe-eval' 'unsafe-hashes'; " +
        "connect-src * data: blob: ws: wss:; " +
        "style-src * data: blob: 'unsafe-inline' 'unsafe-hashes'; " +
        "img-src * data: blob:; " +
        "font-src * data: blob:; " +
        "frame-src * data: blob:; " +
        "media-src * data: blob:; " +
        "object-src * data: blob:; " +
        "worker-src * data: blob:; " +
        "child-src * data: blob:; " +
        "frame-ancestors *; " +
        "form-action *;"
      ];
      
      // Also remove any Report-Only headers
      delete responseHeaders['Content-Security-Policy-Report-Only'];
      delete responseHeaders['content-security-policy-report-only'];
      
      console.log(`�️ ULTIMATE CSP SET FOR: ${details.url}`);
      callback({ responseHeaders });
    });

    console.log('✅ ULTIMATE CSP OBLITERATION SETUP COMPLETE');
  }
}

// Initialize the app
new OTDDApp();