// PWA Installation and Management
class PWAManager {
  constructor() {
    this.deferredPrompt = null;
    this.isInstalled = false;
    this.isOfflineReady = false;
    
    this.init();
  }
  
  init() {
    // Remove existing toasts at startup
    this.removeExistingToasts();
    
    // Check if app is already installed
    this.checkIfInstalled();
    
    // Only proceed with install checks if not already installed
    if (!this.isInstalled) {
      this.checkPWARequirements();
      this.registerServiceWorker();
      this.setupInstallPrompt();
    }
    
    this.setupOfflineDetection();
    this.setupUpdateDetection();
    this.createInstallButton();
    this.createUpdateButton();
  }
  
  removeExistingToasts() {
    const existingToasts = document.querySelectorAll('.pwa-toast');
    existingToasts.forEach(toast => toast.remove());
  }
  
  checkPWARequirements() {
    console.log('PWA Debug: Checking PWA requirements...');
    
    // Check if HTTPS
    const isHTTPS = location.protocol === 'https:' || location.hostname === 'localhost';
    console.log('PWA Debug: HTTPS:', isHTTPS, 'Protocol:', location.protocol);
    
    // Check if Service Worker is supported
    const swSupported = 'serviceWorker' in navigator;
    console.log('PWA Debug: Service Worker supported:', swSupported);
    
    // Check if manifest exists
    fetch('/manifest.json')
      .then(response => {
        console.log('PWA Debug: Manifest accessible:', response.ok);
        return response.json();
      })
      .then(manifest => {
        console.log('PWA Debug: Manifest content:', manifest);
      })
      .catch(err => {
        console.error('PWA Debug: Manifest error:', err);
      });
    
    // Check beforeinstallprompt support
    console.log('PWA Debug: beforeinstallprompt events will be logged...');
    
    if (!isHTTPS && location.hostname !== 'localhost') {
      this.showToast('PWA requires HTTPS to install. Deploy to a secure host.', 'warning');
    }
  }
  
  async registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('PWA: Service Worker registered successfully', registration);
        
        // Listen for service worker updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              this.showUpdateAvailable();
            }
          });
        });
        
        // Check for updates every 60 seconds
        setInterval(() => {
          registration.update();
        }, 60000);
        
      } catch (error) {
        console.error('PWA: Service Worker registration failed', error);
      }
    }
  }
  
  setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('PWA Debug: beforeinstallprompt event fired!', e);
      e.preventDefault();
      this.deferredPrompt = e;
      this.showInstallButton();
      this.showToast('App can be installed! Click the install button.', 'success');
    });
    
    window.addEventListener('appinstalled', () => {
      console.log('PWA Debug: App installed successfully');
      this.isInstalled = true;
      this.hideInstallButton();
      this.showToast('Ludo Game installed successfully!', 'success');
    });
    
    // Manual check for installation criteria (only if not already installed)
    setTimeout(() => {
      if (!this.isInstalled && !this.deferredPrompt) {
        console.log('PWA Debug: No install prompt received. Checking criteria...');
        this.checkInstallCriteria();
      }
    }, 3000);
  }
  
  checkInstallCriteria() {
    // Early return if already installed
    if (this.isInstalled) {
      console.log('PWA Debug: App is already installed, skipping criteria check.');
      this.hideInstallButton();
      return;
    }

    const issues = [];
    
    // Check HTTPS
    if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
      issues.push('Requires HTTPS');
    }
    
    // Check service worker
    if (!('serviceWorker' in navigator)) {
      issues.push('Service Worker not supported');
    }
    
    if (issues.length > 0) {
      console.log('PWA Debug: Install criteria not met:', issues);
      const message = `Cannot install: ${issues.join(', ')}`;
      // Show non-persistent toast instead of persistent one
      this.showToast(message, 'warning');
    } else {
      console.log('PWA Debug: All criteria met, but no install prompt. This may be normal on some browsers.');
    }
  }
  
  setupOfflineDetection() {
    window.addEventListener('online', () => {
      this.showToast('Connection restored', 'success');
      this.updateOnlineStatus(true);
      
      // Remove offline indicator if it exists
      if (window.removeOfflineIndicator) {
        window.removeOfflineIndicator();
      }
    });
    
    window.addEventListener('offline', () => {
      this.showToast('Playing offline - some features may be limited', 'warning');
      this.updateOnlineStatus(false);
      
      // Show offline indicator if needed
      if (window.showOfflineIndicator) {
        window.showOfflineIndicator();
      }
    });
    
    // Initial status
    this.updateOnlineStatus(navigator.onLine);
  }
  
  setupUpdateDetection() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
      
      // Periodically check for updates (every 5 minutes)
      setInterval(() => {
        this.checkForUpdates();
      }, 300000); // 5 minutes
    }
  }
  
  checkIfInstalled() {
    // Check if app is running in standalone mode
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
      this.isInstalled = true;
      this.hideInstallButton();
      console.log('PWA: App is running in standalone mode');
    }
    
    // Check if app is running as PWA on iOS
    if (window.navigator.standalone === true) {
      this.isInstalled = true;
      this.hideInstallButton();
      console.log('PWA: App is running as PWA on iOS');
    }
  }
  
  createInstallButton() {
    // Create install button
    const installButton = document.createElement('button');
    installButton.id = 'pwa-install-btn';
    installButton.className = 'pwa-install-btn hidden';
    installButton.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
      </svg>
      Install App
    `;
    installButton.addEventListener('click', () => this.promptInstall());
    
    // Add to UI controls
    const uiControls = document.querySelector('.ui-controls-top-right');
    if (uiControls) {
      uiControls.insertBefore(installButton, uiControls.firstChild);
    } else {
      document.body.appendChild(installButton);
    }
  }
  
  showInstallButton() {
    const installButton = document.getElementById('pwa-install-btn');
    if (installButton && !this.isInstalled) {
      installButton.classList.remove('hidden');
    }
  }
  
  hideInstallButton() {
    const installButton = document.getElementById('pwa-install-btn');
    if (installButton) {
      installButton.classList.add('hidden');
    }
  }
  
  async promptInstall() {
    if (!this.deferredPrompt) {
      // Show manual install instructions
      this.showManualInstallInstructions();
      return;
    }
    
    try {
      this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('PWA: User accepted the install prompt');
        this.showToast('Installing app...', 'success');
      } else {
        console.log('PWA: User dismissed the install prompt');
        this.showToast('Installation cancelled', 'info');
      }
      
      this.deferredPrompt = null;
      this.hideInstallButton();
    } catch (error) {
      console.error('PWA: Install prompt failed', error);
      this.showManualInstallInstructions();
    }
  }
  
  showManualInstallInstructions() {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    
    let instructions = '';
    
    if (isIOS) {
      instructions = `
        <div class="install-modal">
          <h3>Install Ludo Game on iOS</h3>
          <ol>
            <li>Tap the Share button <span style="font-size: 18px;">⎘</span> in Safari</li>
            <li>Scroll down and tap "Add to Home Screen"</li>
            <li>Tap "Add" to install the app</li>
          </ol>
          <button onclick="this.parentElement.remove()">Got it!</button>
        </div>
      `;
    } else if (isAndroid) {
      instructions = `
        <div class="install-modal">
          <h3>Install Ludo Game on Android</h3>
          <ol>
            <li>Open Chrome menu (⋮)</li>
            <li>Tap "Add to Home screen"</li>
            <li>Tap "Add" to install the app</li>
          </ol>
          <p><strong>Note:</strong> Requires HTTPS for automatic install prompt.</p>
          <button onclick="this.parentElement.remove()">Got it!</button>
        </div>
      `;
    } else {
      instructions = `
        <div class="install-modal">
          <h3>Install Ludo Game</h3>
          <p><strong>Chrome/Edge:</strong> Look for install icon in address bar</p>
          <p><strong>Mobile:</strong> Use browser menu > "Add to Home Screen"</p>
          <p><strong>Note:</strong> Installation requires HTTPS hosting.</p>
          <button onclick="this.parentElement.remove()">Got it!</button>
        </div>
      `;
    }
    
    const modal = document.createElement('div');
    modal.innerHTML = instructions;
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10001;
    `;
    
    document.body.appendChild(modal);
  }
  
  showUpdateAvailable() {
    // Show the update button
    this.showUpdateButton();
    
    // Also show a subtle toast notification that auto-dismisses
    const updateToast = this.createToast(
      'New version available!',
      'info',
      false // Non-persistent - will auto-dismiss
    );
    
    updateToast.classList.add('update-toast');
  }
  
  updateOnlineStatus(isOnline) {
    const statusIndicator = document.getElementById('connection-status');
    if (!statusIndicator) {
      this.createConnectionStatusIndicator();
    }
    
    const indicator = document.getElementById('connection-status');
    if (indicator) {
      indicator.className = `connection-status ${isOnline ? 'online' : 'offline'}`;
      indicator.title = isOnline ? 'Online' : 'Offline';
    }
  }
  
  createConnectionStatusIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'connection-status';
    indicator.className = 'connection-status';
    
    const uiControls = document.querySelector('.ui-controls-top-right');
    if (uiControls) {
      uiControls.appendChild(indicator);
    }
  }
  
  showToast(message, type = 'info', persistent = false, clickHandler = null) {
    return this.createToast(message, type, persistent, clickHandler);
  }
  
  createToast(message, type, persistent, clickHandler) {
    const toast = document.createElement('div');
    toast.className = `pwa-toast pwa-toast-${type}`;
    toast.textContent = message;
    
    if (clickHandler) {
      toast.style.cursor = 'pointer';
      toast.addEventListener('click', clickHandler);
    }
    
    document.body.appendChild(toast);
    
    // Animate in
    setTimeout(() => toast.classList.add('show'), 100);
    
    // Auto remove if not persistent
    if (!persistent) {
      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => document.body.removeChild(toast), 300);
      }, 3000);
    }
    
    return toast;
  }
  
  // Method to check cache status
  async getCacheStatus() {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      return new Promise((resolve) => {
        const messageChannel = new MessageChannel();
        messageChannel.port1.onmessage = (event) => {
          resolve(event.data);
        };
        
        navigator.serviceWorker.controller.postMessage(
          { type: 'GET_CACHE_STATUS' },
          [messageChannel.port2]
        );
      });
    }
    return { isOfflineReady: false };
  }
  
  createUpdateButton() {
    // Create update button
    const updateButton = document.createElement('button');
    updateButton.id = 'pwa-update-btn';
    updateButton.className = 'pwa-update-btn hidden';
    updateButton.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
      </svg>
      Update App
    `;
    updateButton.addEventListener('click', () => this.promptUpdate());
    
    // Add to UI controls
    const uiControls = document.querySelector('.ui-controls-top-right');
    if (uiControls) {
      // Insert before the install button or at the beginning
      const installButton = document.getElementById('pwa-install-btn');
      if (installButton) {
        uiControls.insertBefore(updateButton, installButton);
      } else {
        uiControls.insertBefore(updateButton, uiControls.firstChild);
      }
    } else {
      document.body.appendChild(updateButton);
    }
  }
  
  showUpdateButton() {
    const updateButton = document.getElementById('pwa-update-btn');
    if (updateButton) {
      updateButton.classList.remove('hidden');
    }
  }
  
  hideUpdateButton() {
    const updateButton = document.getElementById('pwa-update-btn');
    if (updateButton) {
      updateButton.classList.add('hidden');
    }
  }
  
  async promptUpdate() {
    try {
      // Send message to service worker to skip waiting
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' });
        
        // Reload the page to load the new version
        window.location.reload();
      }
    } catch (error) {
      console.error('PWA: Update failed', error);
      this.showToast('Update failed. Please try again later.', 'error');
    }
  }
  
  // Method to manually check for updates
  async checkForUpdates() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          // Force update check
          await registration.update();
          this.showToast('Checking for updates...', 'info');
        }
      } catch (error) {
        console.error('PWA: Update check failed', error);
        this.showToast('Failed to check for updates', 'error');
      }
    }
  }

}

// CSS for PWA components
const pwaStyles = `
  .pwa-install-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: #4CAF50;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s ease;
    margin-right: 8px;
  }
  
  .pwa-install-btn:hover {
    background: #45a049;
    transform: translateY(-1px);
  }
  
  .pwa-install-btn.hidden {
    display: none;
  }
  
  .pwa-update-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: #2196F3;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s ease;
    margin-right: 8px;
  }
  
  .pwa-update-btn:hover {
    background: #1976D2;
    transform: translateY(-1px);
  }
  
  .pwa-update-btn.hidden {
    display: none;
  }
  
  .connection-status {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    margin-left: 8px;
    transition: all 0.3s ease;
  }
  
  .connection-status.online {
    background: #4CAF50;
    box-shadow: 0 0 8px rgba(76, 175, 80, 0.6);
  }
  
  .connection-status.offline {
    background: #f44336;
    box-shadow: 0 0 8px rgba(244, 67, 54, 0.6);
  }
  
  .pwa-toast {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: 8px;
    color: white;
    font-weight: 500;
    font-size: 14px;
    z-index: 10000;
    opacity: 0;
    transform: translateX(100%);
    transition: all 0.3s ease;
    max-width: 300px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
  
  .pwa-toast.show {
    opacity: 1;
    transform: translateX(0);
  }
  
  .pwa-toast-success {
    background: #4CAF50;
  }
  
  .pwa-toast-warning {
    background: #ff9800;
  }
  
  .pwa-toast-info {
    background: #2196F3;
  }
  
  .pwa-toast-error {
    background: #f44336;
  }
  
  .update-toast {
    cursor: pointer;
  }
  
  .update-toast:hover {
    transform: translateX(-5px);
  }
  
  .install-modal {
    background: white;
    color: #333;
    padding: 30px;
    border-radius: 12px;
    max-width: 400px;
    margin: 20px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
  }
  
  .install-modal h3 {
    margin: 0 0 20px 0;
    color: #4CAF50;
    text-align: center;
  }
  
  .install-modal ol {
    margin: 20px 0;
    padding-left: 20px;
  }
  
  .install-modal li {
    margin: 10px 0;
    line-height: 1.4;
  }
  
  .install-modal button {
    background: #4CAF50;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 16px;
    width: 100%;
    margin-top: 20px;
  }
  
  .install-modal button:hover {
    background: #45a049;
  }
`;

// Inject PWA styles
const styleSheet = document.createElement('style');
styleSheet.textContent = pwaStyles;
document.head.appendChild(styleSheet);

// Initialize PWA Manager when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.pwaManager = new PWAManager();
  });
} else {
  window.pwaManager = new PWAManager();
}
