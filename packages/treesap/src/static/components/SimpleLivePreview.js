// SimpleLivePreview component JavaScript
import { sidebarStore } from '/signals/SidebarSignal.js';

class SimpleLivePreviewManager {
  constructor(id = 'simple-preview') {
    this.id = id;
    
    // DOM elements
    this.container = document.getElementById(id);
    this.hideSidebarBtn = document.getElementById(`${id}-hide-sidebar-btn`);
    this.hideSidebarIcon = document.getElementById(`${id}-hide-sidebar-icon`);
    this.floatingHideSidebarBtn = document.getElementById(`${id}-floating-hide-sidebar-btn`);
    this.floatingHideSidebarIcon = document.getElementById(`${id}-floating-hide-sidebar-icon`);
    this.refreshBtn = document.getElementById(`${id}-refresh-btn`);
    this.urlInput = document.getElementById(`${id}-url-input`);
    this.loadBtn = document.getElementById(`${id}-load-btn`);
    this.iframe = document.getElementById(`${id}-iframe`);
    
    // Get preview port from iframe data attribute
    this.previewPort = this.iframe?.getAttribute('data-preview-port') || 5173;
    
    // Reference to the sidebar store
    this.store = sidebarStore;
    
    this.init();
  }

  init() {
    console.log('Initializing SimpleLivePreview:', this.id);
    console.log('Elements found:', {
      container: !!this.container,
      urlInput: !!this.urlInput,
      loadBtn: !!this.loadBtn,
      iframe: !!this.iframe
    });
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Subscribe to sidebar store changes
    this.subscribeToStore();
  }

  setupEventListeners() {
    // Hide sidebar toggle (both sidebar and floating button)
    this.hideSidebarBtn?.addEventListener('click', () => this.store.toggle());
    this.floatingHideSidebarBtn?.addEventListener('click', () => this.store.toggle());

    // Refresh button
    this.refreshBtn?.addEventListener('click', () => this.refreshIframe());

    // URL navigation
    this.loadBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      this.loadUrl();
    });
    this.urlInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.loadUrl();
      }
    });

    // Prevent form submission if input is in a form
    this.urlInput?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.loadUrl();
    });

    // Listen for events from Sidebar component
    document.addEventListener('preview:refresh', () => this.refreshIframe());
    document.addEventListener('preview:loadUrl', (e) => {
      if (e.detail && e.detail.path !== undefined) {
        this.loadUrlFromPath(e.detail.path);
      }
    });

    // Legacy: Listen for sidebar state changes (for backward compatibility)
    document.addEventListener('sidebar:stateChanged', (e) => {
      if (e.detail) {
        this.handleSidebarStateChange(e.detail);
      }
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Cmd/Ctrl + R for refresh
      if ((e.metaKey || e.ctrlKey) && e.key === 'r' && this.iframe && this.iframe.closest(`#${this.id}`)) {
        e.preventDefault();
        this.refreshIframe();
      }
    });

    // Handle iframe load errors (for X-Frame-Options violations)
    if (this.iframe) {
      // Store the current src to detect external navigation
      let lastSrc = this.iframe.src;
      
      this.iframe.addEventListener('error', (e) => {
        console.log('Iframe load error, possibly due to X-Frame-Options');
        this.handleIframeError();
      });

      // Monitor src changes to catch navigation
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'src') {
            const newSrc = this.iframe.src;
            console.log('Iframe src changed from', lastSrc, 'to', newSrc);
            
            // Check if it's an external URL
            if (newSrc && (newSrc.startsWith('http://') || newSrc.startsWith('https://'))) {
              const localServerUrl = `http://localhost:${this.previewPort}`;
              if (!newSrc.startsWith(localServerUrl)) {
                console.log('Detected external navigation, redirecting to new tab:', newSrc);
                // Prevent the navigation by restoring the previous src
                this.iframe.src = lastSrc;
                // Open in new tab
                window.open(newSrc, '_blank');
                return;
              }
            }
            lastSrc = newSrc;
          }
        });
      });
      
      observer.observe(this.iframe, { attributes: true, attributeFilter: ['src'] });

      // Also listen for load events to detect if content failed to load
      this.iframe.addEventListener('load', () => {
        try {
          // Try to access the iframe's location - this will throw if blocked by X-Frame-Options
          const iframeUrl = this.iframe.contentWindow?.location?.href;
          if (!iframeUrl || iframeUrl === 'about:blank') {
            // Might be a blocked frame
            setTimeout(() => this.checkIframeContent(), 100);
          }
        } catch (error) {
          console.log('Cannot access iframe content, likely blocked by security policy');
          this.handleIframeError();
        }
      });
    }
  }

  subscribeToStore() {
    // Subscribe to sidebar store changes
    this.store.shouldShowFloatingButton.subscribe(() => this.updateFloatingButton());
    this.store.isOpen.subscribe(() => this.updateFloatingButton());
    
    // Initial update
    this.updateFloatingButton();
  }

  updateFloatingButton() {
    const floatingBtn = this.floatingHideSidebarBtn;
    const floatingIcon = this.floatingHideSidebarIcon;
    const shouldShow = this.store.shouldShowFloatingButton.value;
    
    if (floatingBtn) {
      if (shouldShow) {
        // Show floating button when sidebar is closed
        floatingBtn.style.display = 'flex';
        // Update icon and title
        if (floatingIcon) {
          floatingIcon.setAttribute('icon', 'ph:sidebar-simple-fill');
        }
        floatingBtn.setAttribute('title', 'Show Sidebar');
      } else {
        // Hide floating button when sidebar is open
        floatingBtn.style.display = 'none';
      }
    }
  }

  toggleSidebarVisibility() {
    // Use the store to toggle
    this.store.toggle();
  }

  refreshIframe() {
    if (this.iframe) {
      console.log('Refreshing iframe...');
      // Force reload by adding timestamp
      const url = new URL(this.iframe.src);
      url.searchParams.set('_t', Date.now().toString());
      this.iframe.src = url.toString();
    }
  }

  loadUrl() {
    if (this.urlInput && this.iframe) {
      const path = this.urlInput.value.trim();
      this.loadUrlFromPath(path);
    }
  }

  loadUrlFromPath(path) {
    if (this.iframe) {
      console.log('loadUrlFromPath called with path:', path);
      
      // Check if it's an external URL (starts with http:// or https://)
      if (path.startsWith('http://') || path.startsWith('https://')) {
        // Check if it's NOT our local server
        const localServerUrl = `http://localhost:${this.previewPort}`;
        if (!path.startsWith(localServerUrl)) {
          // Open external URLs in a new tab
          console.log('Opening external URL in new tab:', path);
          window.open(path, '_blank');
          // Clear the input if it exists
          if (this.urlInput) {
            this.urlInput.value = '';
          }
          return;
        }
      }
      
      const baseUrl = `http://localhost:${this.previewPort}`;
      const newUrl = path ? baseUrl + '/' + path.replace(/^\//, '') : baseUrl;
      console.log('Loading URL in iframe:', newUrl);
      this.iframe.src = newUrl;
      
      // Update input if it exists
      if (this.urlInput) {
        this.urlInput.value = path;
      }
    }
  }

  handleSidebarStateChange(state) {
    // Legacy method for backward compatibility
    console.log('Legacy sidebar state changed:', state);
    // The floating button is now handled by updateFloatingButton()
  }

  handleIframeError() {
    // Get the current iframe src and open it in a new tab if it's external
    if (this.iframe && this.iframe.src) {
      const src = this.iframe.src;
      if (src.startsWith('http://') || src.startsWith('https://')) {
        if (!src.startsWith(`http://localhost:${this.previewPort}`)) {
          console.log('Opening blocked external URL in new tab:', src);
          window.open(src, '_blank');
          // Reset iframe to local server
          this.iframe.src = `http://localhost:${this.previewPort}`;
          // Clear input if it exists
          if (this.urlInput) {
            this.urlInput.value = '';
          }
        }
      }
    }
  }

  checkIframeContent() {
    // Additional check for iframe content accessibility
    if (this.iframe) {
      try {
        const doc = this.iframe.contentDocument;
        if (!doc || doc.body.innerHTML === '') {
          this.handleIframeError();
        }
      } catch (error) {
        this.handleIframeError();
      }
    }
  }

  destroy() {
    // Clean up event listeners if needed
    // (Optional since Sapling handles cleanup)
  }
}

// Auto-initialize when script loads
console.log('SimpleLivePreview.js loaded, looking for preview containers...');

function initializeSimpleLivePreview() {
  // Look for all sapling-islands and find the ones with SimpleLivePreview content
  const saplingIslands = document.querySelectorAll('sapling-island');
  
  for (const island of saplingIslands) {
    // Look for a div with an iframe that has data-preview-port
    const previewDiv = island.querySelector('div[id] iframe[data-preview-port]');
    if (previewDiv) {
      const parentDiv = previewDiv.closest('div[id]');
      if (parentDiv && parentDiv.id) {
        console.log('Found SimpleLivePreview component with ID:', parentDiv.id);
        new SimpleLivePreviewManager(parentDiv.id);
      }
    }
  }
}

// Initialize immediately since Sapling islands are ready
initializeSimpleLivePreview();

// Make available globally
window.SimpleLivePreviewManager = SimpleLivePreviewManager;

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  // Cleanup handled by Sapling automatically
});