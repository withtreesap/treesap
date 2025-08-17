import { signal, computed } from 'https://esm.sh/@preact/signals@1.2.2';

// Live Preview state management
class LivePreviewStore {
  constructor() {
    // Core state signals
    this.refreshTrigger = signal(0);
    this.previewPort = signal(5173); // Default port
    this.currentUrl = signal('http://localhost:5173');
    this.isMobileView = signal(false);
    this.isLoading = signal(false);
    
    // Computed values
    this.shouldRefresh = computed(() => this.refreshTrigger.value);
    this.baseUrl = computed(() => `http://localhost:${this.previewPort.value}`);
  }
  
  // Actions for managing preview state
  refresh() {
    this.refreshTrigger.value = this.refreshTrigger.value + 1;
  }
  
  setPreviewPort(port) {
    this.previewPort.value = port;
    // Update currentUrl to use new port if it was using the old port
    const currentUrlValue = this.currentUrl.value;
    const oldPort = currentUrlValue.match(/:(\d+)/)?.[1];
    if (oldPort) {
      this.currentUrl.value = currentUrlValue.replace(`:${oldPort}`, `:${port}`);
    } else {
      this.currentUrl.value = `http://localhost:${port}`;
    }
  }
  
  setUrl(url) {
    this.currentUrl.value = url;
    this.refresh(); // Auto-refresh when URL changes
  }
  
  toggleMobileView() {
    this.isMobileView.value = !this.isMobileView.value;
  }
  
  setLoading(isLoading) {
    this.isLoading.value = isLoading;
  }
  
  // Debug helpers
  getState() {
    return {
      refreshTrigger: this.refreshTrigger.value,
      previewPort: this.previewPort.value,
      currentUrl: this.currentUrl.value,
      isMobileView: this.isMobileView.value,
      isLoading: this.isLoading.value,
      baseUrl: this.baseUrl.value
    };
  }
  
  logState() {
    console.log('Live Preview State:', this.getState());
  }
}

// Create and export singleton instance
export const livePreviewStore = new LivePreviewStore();

// Make it available globally for debugging
if (typeof window !== 'undefined') {
  window.livePreviewStore = livePreviewStore;
}