// Sidebar component JavaScript for responsive behavior
import { sidebarStore } from '/signals/SidebarSignal.js';

class SidebarManager {
  constructor(id = 'sidebar') {
    this.id = id;
    
    // DOM elements
    this.backdrop = document.getElementById(`${id}-backdrop`);
    this.pane = document.getElementById(`${id}-pane`);
    this.closeBtn = document.getElementById(`${id}-close-btn`);
    this.refreshBtn = document.getElementById('live-preview-refresh-btn');
    this.urlInput = document.getElementById('live-preview-url-input');
    this.loadBtn = document.getElementById('live-preview-load-btn');
    
    // Reference to the sidebar store
    this.store = sidebarStore;
    
    this.init();
  }

  init() {
    console.log('Initializing Sidebar:', this.id);
    console.log('Elements found:', {
      backdrop: !!this.backdrop,
      pane: !!this.pane,
      closeBtn: !!this.closeBtn,
      refreshBtn: !!this.refreshBtn,
      urlInput: !!this.urlInput,
      loadBtn: !!this.loadBtn
    });
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Subscribe to store state changes
    this.subscribeToStore();
    
    // Initial state update
    this.updateSidebarState();
    this.updateMobileToggle();
  }

  setupEventListeners() {
    // Mobile close button
    this.closeBtn?.addEventListener('click', () => this.store.close());
    
    // Backdrop click to close
    this.backdrop?.addEventListener('click', () => this.store.close());
    
    // Mobile toggle button (in main layout)
    const mobileToggle = document.getElementById('mobile-sidebar-toggle');
    mobileToggle?.addEventListener('click', () => this.store.toggle());
    
    // Refresh button
    this.refreshBtn?.addEventListener('click', () => this.refreshPreview());
    
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
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Escape key to close sidebar on mobile
      if (e.key === 'Escape' && this.store.isMobile.value && this.store.isOpen.value) {
        e.preventDefault();
        this.store.close();
      }
      
      // Cmd/Ctrl + B to toggle sidebar
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        this.store.toggle();
      }
    });
    
    // Listen for custom events to maintain backward compatibility
    document.addEventListener('sidebar:toggle', () => this.store.toggle());
    document.addEventListener('sidebar:open', () => this.store.open());
    document.addEventListener('sidebar:close', () => this.store.close());
  }

  subscribeToStore() {
    // Subscribe to store changes and update UI accordingly
    this.store.isOpen.subscribe(() => this.updateSidebarState());
    this.store.isMobile.subscribe(() => this.updateSidebarState());
    this.store.shouldShowBackdrop.subscribe(() => this.updateSidebarState());
    this.store.shouldShowMobileToggle.subscribe(() => this.updateMobileToggle());
  }

  updateSidebarState() {
    if (!this.pane || !this.backdrop) return;
    
    const isOpen = this.store.isOpen.value;
    const isMobile = this.store.isMobile.value;
    const shouldShowBackdrop = this.store.shouldShowBackdrop.value;
    
    if (isMobile) {
      // Mobile behavior: overlay
      if (shouldShowBackdrop) {
        // Show backdrop
        this.backdrop.classList.remove('opacity-0', 'pointer-events-none');
        this.backdrop.classList.add('opacity-100');
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
      } else {
        // Hide backdrop
        this.backdrop.classList.remove('opacity-100');
        this.backdrop.classList.add('opacity-0', 'pointer-events-none');
        
        // Restore body scroll
        document.body.style.overflow = '';
      }
      
      if (isOpen) {
        // Show sidebar
        this.pane.classList.remove('-translate-x-full');
        this.pane.classList.add('translate-x-0');
      } else {
        // Hide sidebar
        this.pane.classList.remove('translate-x-0');
        this.pane.classList.add('-translate-x-full');
      }
    } else {
      // Desktop behavior: side panel
      // Hide backdrop (not needed on desktop)
      this.backdrop.classList.add('opacity-0', 'pointer-events-none');
      
      // Restore body scroll
      document.body.style.overflow = '';
      
      if (isOpen) {
        // Show sidebar
        this.pane.classList.remove('-translate-x-full');
        this.pane.classList.add('translate-x-0');
        this.pane.style.display = '';
      } else {
        // Hide sidebar completely on desktop
        this.pane.style.display = 'none';
      }
    }
  }

  updateMobileToggle() {
    const mobileToggle = document.getElementById('mobile-sidebar-toggle');
    const shouldShow = this.store.shouldShowMobileToggle.value;
    
    if (mobileToggle) {
      mobileToggle.style.display = shouldShow ? 'flex' : 'none';
    }
  }

  refreshPreview() {
    // Dispatch event for SimpleLivePreview to handle
    document.dispatchEvent(new CustomEvent('preview:refresh'));
  }

  loadUrl() {
    if (this.urlInput) {
      const path = this.urlInput.value.trim();
      // Dispatch event for SimpleLivePreview to handle
      document.dispatchEvent(new CustomEvent('preview:loadUrl', {
        detail: { path }
      }));
    }
  }

  // Public API methods
  getState() {
    return this.store.getState();
  }

  destroy() {
    // Restore body scroll
    document.body.style.overflow = '';
    
    // Clean up is handled by the signal store
  }
}

// Auto-initialize when script loads
console.log('Sidebar.js loaded, looking for sidebar containers...');

function initializeSidebar() {
  // Look for sapling-islands containing sidebar content
  const saplingIslands = document.querySelectorAll('sapling-island');
  
  for (const island of saplingIslands) {
    // Look for sidebar pane div
    const sidebarPane = island.querySelector('div[id$="-pane"]');
    if (sidebarPane && sidebarPane.id.includes('sidebar')) {
      const sidebarId = sidebarPane.id.replace('-pane', '');
      console.log('Found Sidebar component with ID:', sidebarId);
      
      // Create and store manager
      const manager = new SidebarManager(sidebarId);
      window.sidebarManager = manager; // Make globally available
      
      break; // Only one sidebar per page
    }
  }
}

// Initialize immediately since Sapling islands are ready
initializeSidebar();

// Make available globally
window.SidebarManager = SidebarManager;

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (window.sidebarManager) {
    window.sidebarManager.destroy();
  }
});