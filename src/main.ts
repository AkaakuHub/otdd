import { app, BrowserWindow, session } from 'electron';
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
    app.whenReady().then(() => {
      this.setupExtensions();
      this.createMainWindow();
      this.loadExtensions();
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
    
    this.extensions = new ElectronChromeExtensions({
      session: session.defaultSession,
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

  private createMainWindow(): void {
    this.mainWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      minWidth: 800,
      minHeight: 600,
      show: false,
      title: 'Old TweetDeck Desktop',
      icon: this.getAppIcon(),
      backgroundColor: '#15202b',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload/preload.js'),
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
    });

    // Load TweetDeck
    this.mainWindow.loadURL('https://x.com/i/tweetdeck');

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

    // Development tools
    if (process.env.NODE_ENV === 'development') {
      this.mainWindow.webContents.openDevTools();
    }
  }

  private async loadExtensions(): Promise<void> {
    const extensionsPath = path.join(__dirname, '../extensions');
    
    if (!fs.existsSync(extensionsPath)) {
      console.log('Extensions directory not found, creating...');
      fs.mkdirSync(extensionsPath, { recursive: true });
      return;
    }

    try {
      const extensionDirs = fs.readdirSync(extensionsPath, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => dirent.name);

      for (const extensionDir of extensionDirs) {
        const extensionPath = path.join(extensionsPath, extensionDir);
        const manifestPath = path.join(extensionPath, 'manifest.json');

        if (fs.existsSync(manifestPath)) {
          try {
            console.log(`Loading extension: ${extensionDir}`);
            
            // Read manifest to check version and apply appropriate loading strategy
            const manifestContent = fs.readFileSync(manifestPath, 'utf8');
            const manifest = JSON.parse(manifestContent);
            
            const loadOptions: any = {
              allowFileAccess: true
            };
            
            // Enhanced support for V2 extensions
            if (manifest.manifest_version === 2) {
              console.log(`Loading Manifest V2 extension: ${extensionDir}`);
              loadOptions.allowServiceWorkers = false; // Disable service workers for V2
            }
            
            await session.defaultSession.loadExtension(extensionPath, loadOptions);
            console.log(`Successfully loaded extension: ${extensionDir} (Manifest v${manifest.manifest_version || 'unknown'})`);
            
          } catch (error) {
            console.error(`Failed to load extension ${extensionDir}:`, error);
            // Try loading with minimal options as fallback
            try {
              await session.defaultSession.loadExtension(extensionPath);
              console.log(`Successfully loaded extension ${extensionDir} (fallback mode)`);
            } catch (fallbackError) {
              console.error(`Extension ${extensionDir} failed completely:`, fallbackError);
            }
          }
        } else {
          console.warn(`Extension ${extensionDir} missing manifest.json`);
        }
      }
    } catch (error) {
      console.error('Error loading extensions:', error);
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

    // Inject comprehensive Chrome API polyfills directly into the page
    this.mainWindow.webContents.executeJavaScript(`
      // Comprehensive Chrome API polyfills for extension compatibility
      if (typeof chrome === 'undefined') {
        window.chrome = {};
      }

      // Polyfill for chrome.browserAction (V2)
      if (!chrome.browserAction) {
        chrome.browserAction = {
          onClicked: {
            addListener: function(callback) { /* V2 browserAction polyfill */ },
            removeListener: function(callback) { /* V2 browserAction polyfill */ }
          },
          setIcon: function(details, callback) { if (callback) callback(); },
          setTitle: function(details, callback) { if (callback) callback(); },
          setBadgeText: function(details, callback) { if (callback) callback(); },
          setBadgeBackgroundColor: function(details, callback) { if (callback) callback(); },
          enable: function(tabId, callback) { if (callback) callback(); },
          disable: function(tabId, callback) { if (callback) callback(); }
        };
      }

      // Polyfill for chrome.action (V3) - map to browserAction for V2 compatibility
      if (!chrome.action) {
        chrome.action = chrome.browserAction;
      }

      // Polyfill for chrome.contextMenus
      if (!chrome.contextMenus) {
        chrome.contextMenus = {
          create: function(properties, callback) { if (callback) callback(); },
          update: function(id, properties, callback) { if (callback) callback(); },
          remove: function(id, callback) { if (callback) callback(); },
          onClicked: {
            addListener: function(callback) { /* contextMenus polyfill */ },
            removeListener: function(callback) { /* contextMenus polyfill */ }
          }
        };
      }

      // Polyfill for chrome.notifications
      if (!chrome.notifications) {
        chrome.notifications = {
          create: function(id, options, callback) { if (callback) callback(id); },
          update: function(id, options, callback) { if (callback) callback(false); },
          clear: function(id, callback) { if (callback) callback(false); }
        };
      }

      // Polyfill for chrome.webNavigation
      if (!chrome.webNavigation) {
        chrome.webNavigation = {
          onCompleted: {
            addListener: function(callback) { /* webNavigation polyfill */ },
            removeListener: function(callback) { /* webNavigation polyfill */ }
          },
          onBeforeNavigate: {
            addListener: function(callback) { /* webNavigation polyfill */ },
            removeListener: function(callback) { /* webNavigation polyfill */ }
          }
        };
      }

      // Polyfill for chrome.cookies
      if (!chrome.cookies) {
        chrome.cookies = {
          get: function(details, callback) { callback(null); },
          set: function(details, callback) { if (callback) callback(null); },
          remove: function(details, callback) { if (callback) callback(null); }
        };
      }

      // Polyfill for chrome.commands
      if (!chrome.commands) {
        chrome.commands = {
          onCommand: {
            addListener: function(callback) { /* commands polyfill */ },
            removeListener: function(callback) { /* commands polyfill */ }
          },
          getAll: function(callback) { callback([]); }
        };
      }

      console.log('Chrome API polyfills injected successfully');
    `).catch(err => {
      console.error('Failed to inject Chrome polyfills:', err);
    });
  }
}

// Initialize the app
new OTDDApp();