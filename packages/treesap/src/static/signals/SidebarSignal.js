import { signal, computed } from 'https://esm.sh/@preact/signals@1.2.2';

// Sidebar state management
class SidebarStore {
  constructor() {
    // Core state signals
    this.isOpen = signal(true); // Default to open on desktop
    this.isMobile = signal(false); // Track if we're in mobile viewport
    this.mobileBreakpoint = signal(768); // Breakpoint for mobile/desktop detection
    
    // Computed values
    this.shouldShowBackdrop = computed(() => this.isMobile.value && this.isOpen.value);
    this.shouldShowMobileToggle = computed(() => this.isMobile.value && !this.isOpen.value);
    this.shouldShowFloatingButton = computed(() => !this.isMobile.value && !this.isOpen.value);
    
    // Initialize mobile detection
    this.initializeMobileDetection();
  }
  
  // Initialize mobile detection and set initial state
  initializeMobileDetection() {
    if (typeof window !== 'undefined') {
      this.updateMobileState();
      
      // Listen for window resize
      window.addEventListener('resize', () => {
        this.updateMobileState();
      });
    }
  }
  
  // Update mobile state based on window width
  updateMobileState() {
    if (typeof window === 'undefined') return;
    
    const wasMobile = this.isMobile.value;
    const nowMobile = window.innerWidth < this.mobileBreakpoint.value;
    
    this.isMobile.value = nowMobile;
    
    // Handle initial state or breakpoint transitions
    if (wasMobile === undefined) {
      // First time: desktop shows sidebar, mobile hides it
      this.isOpen.value = !nowMobile;
    } else if (wasMobile !== nowMobile) {
      // Breakpoint changed
      if (wasMobile && !nowMobile) {
        // Mobile to desktop: show sidebar
        this.isOpen.value = true;
      } else if (!wasMobile && nowMobile) {
        // Desktop to mobile: hide sidebar
        this.isOpen.value = false;
      }
    }
  }
  
  // Actions for managing sidebar state
  toggle() {
    this.isOpen.value = !this.isOpen.value;
    console.log(`Sidebar toggled: ${this.isOpen.value ? 'open' : 'closed'}`);
  }
  
  open() {
    this.isOpen.value = true;
    console.log('Sidebar opened');
  }
  
  close() {
    this.isOpen.value = false;
    console.log('Sidebar closed');
  }
  
  // Set mobile breakpoint
  setMobileBreakpoint(breakpoint) {
    this.mobileBreakpoint.value = breakpoint;
    this.updateMobileState();
  }
  
  // Get current state (useful for components that need to read state once)
  getState() {
    return {
      isOpen: this.isOpen.value,
      isMobile: this.isMobile.value,
      mobileBreakpoint: this.mobileBreakpoint.value,
      shouldShowBackdrop: this.shouldShowBackdrop.value,
      shouldShowMobileToggle: this.shouldShowMobileToggle.value,
      shouldShowFloatingButton: this.shouldShowFloatingButton.value
    };
  }
  
  // Debug helpers
  logState() {
    console.log('Sidebar Store State:', this.getState());
  }
  
  // Subscribe to state changes (for components that need to react to changes)
  onStateChange(callback) {
    // Create an effect that runs when any sidebar state changes
    const unsubscribe = () => {
      // This is a simple implementation - in a full app you might want more granular subscriptions
      const state = this.getState();
      callback(state);
    };
    
    // Subscribe to all relevant signals
    this.isOpen.subscribe(unsubscribe);
    this.isMobile.subscribe(unsubscribe);
    
    // Return unsubscribe function
    return () => {
      // Note: Preact signals don't have a direct unsubscribe method
      // In a production app, you'd want to implement proper cleanup
    };
  }
}

// Create and export singleton instance
export const sidebarStore = new SidebarStore();

// Make it available globally for debugging
if (typeof window !== 'undefined') {
  window.sidebarStore = sidebarStore;
}