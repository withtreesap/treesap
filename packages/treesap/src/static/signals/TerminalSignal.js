import { signal, computed } from 'https://esm.sh/@preact/signals@1.2.2';

// Terminal state management for multiple terminals with cross-tab sync
class TerminalStore {
  constructor() {
    // Core state signals
    this.terminals = signal([]);  // Array of terminal objects: {id, sessionId, status, index, clientCount}
    this.activeTerminalId = signal('terminal-1'); // Currently active terminal
    this.nextTerminalIndex = signal(1); // For generating new terminal indices
    
    // Cross-tab sync signals
    this.sessionClients = signal(new Map()); // sessionId -> client count
    this.globalStatus = signal('initializing'); // Overall connection status
    
    // Computed values
    this.activeTerminal = computed(() => 
      this.terminals.value.find(t => t.id === this.activeTerminalId.value)
    );
    this.terminalCount = computed(() => this.terminals.value.length);
    this.hasConnectedTerminals = computed(() => 
      this.terminals.value.some(t => t.status === 'connected')
    );
    
    // Initialize cross-tab communication
    this.initializeCrossTabSync();
  }
  
  // Actions for managing terminals
  addTerminal(index = null) {
    const terminalIndex = index || this.nextTerminalIndex.value;
    const terminalId = `terminal-${terminalIndex}`;
    const sessionId = `terminal-${terminalIndex}`;
    
    // Check if terminal already exists
    const existingTerminal = this.terminals.value.find(t => t.id === terminalId);
    if (existingTerminal) {
      console.log(`Terminal ${terminalId} already exists, updating status`);
      this.updateTerminalStatus(terminalId, 'connecting');
      return existingTerminal;
    }
    
    const newTerminal = {
      id: terminalId,
      sessionId: sessionId,
      index: terminalIndex,
      status: 'connecting',
      createdAt: new Date()
    };
    
    this.terminals.value = [...this.terminals.value, newTerminal];
    
    // Set as active if it's the first terminal
    if (this.terminals.value.length === 1) {
      this.activeTerminalId.value = terminalId;
    }
    
    // Update next index counter
    if (terminalIndex >= this.nextTerminalIndex.value) {
      this.nextTerminalIndex.value = terminalIndex + 1;
    }
    
    console.log(`Added terminal: ${terminalId}`);
    return newTerminal;
  }
  
  removeTerminal(terminalId) {
    const terminals = this.terminals.value.filter(t => t.id !== terminalId);
    this.terminals.value = terminals;
    
    // If we removed the active terminal, switch to another one
    if (this.activeTerminalId.value === terminalId) {
      if (terminals.length > 0) {
        this.activeTerminalId.value = terminals[0].id;
      } else {
        this.activeTerminalId.value = 'terminal-1';
      }
    }
    
    console.log(`Removed terminal: ${terminalId}`);
  }
  
  setActiveTerminal(terminalId) {
    const terminal = this.terminals.value.find(t => t.id === terminalId);
    if (terminal) {
      this.activeTerminalId.value = terminalId;
      console.log(`Set active terminal: ${terminalId}`);
    }
  }
  
  updateTerminalStatus(terminalId, status) {
    const terminals = this.terminals.value.map(t => 
      t.id === terminalId ? { ...t, status, lastUpdated: new Date() } : t
    );
    this.terminals.value = terminals;
    console.log(`Updated terminal ${terminalId} status to: ${status}`);
  }
  
  getTerminalByIndex(index) {
    return this.terminals.value.find(t => t.index === index);
  }
  
  getTerminalById(terminalId) {
    return this.terminals.value.find(t => t.id === terminalId);
  }
  
  getSessionId(terminalId) {
    const terminal = this.getTerminalById(terminalId);
    return terminal ? terminal.sessionId : null;
  }
  
  // Get next available terminal index
  getNextIndex() {
    return this.nextTerminalIndex.value;
  }
  
  // Debug helpers
  getState() {
    return {
      terminals: this.terminals.value,
      activeTerminalId: this.activeTerminalId.value,
      nextTerminalIndex: this.nextTerminalIndex.value,
      activeTerminal: this.activeTerminal.value,
      terminalCount: this.terminalCount.value
    };
  }
  
  logState() {
    console.log('Terminal Store State:', this.getState());
  }
  
  // Initialize cross-tab communication
  initializeCrossTabSync() {
    // Listen for WebSocket events from terminal managers
    this.setupWebSocketEventListeners();
    
    // Listen for browser storage events for cross-tab sync
    this.setupStorageEventListeners();
    
    // Initialize from any existing state in localStorage
    this.loadStateFromStorage();
  }
  
  setupWebSocketEventListeners() {
    // Custom events dispatched by TerminalManager
    document.addEventListener('terminal:clients_count', (event) => {
      this.updateSessionClientCount(event.detail.sessionId, event.detail.count);
    });
    
    document.addEventListener('terminal:session_closed', (event) => {
      this.handleSessionClosed(event.detail.sessionId);
    });
    
    document.addEventListener('terminal:global_status', (event) => {
      this.globalStatus.value = event.detail.status;
    });
  }
  
  setupStorageEventListeners() {
    // Listen for changes from other tabs
    window.addEventListener('storage', (event) => {
      if (event.key === 'treesap_terminal_state') {
        this.syncFromStorage(event.newValue);
      }
    });
    
    // Save state to storage when terminals change
    this.terminals.subscribe(() => {
      this.saveStateToStorage();
    });
  }
  
  loadStateFromStorage() {
    try {
      const savedState = localStorage.getItem('treesap_terminal_state');
      if (savedState) {
        const state = JSON.parse(savedState);
        // Only sync certain properties, not connection status which is per-tab
        if (state.activeTerminalId) {
          this.activeTerminalId.value = state.activeTerminalId;
        }
        if (state.nextTerminalIndex) {
          this.nextTerminalIndex.value = state.nextTerminalIndex;
        }
      }
    } catch (error) {
      console.error('Error loading terminal state from storage:', error);
    }
  }
  
  saveStateToStorage() {
    try {
      const state = {
        activeTerminalId: this.activeTerminalId.value,
        nextTerminalIndex: this.nextTerminalIndex.value,
        timestamp: Date.now()
      };
      localStorage.setItem('treesap_terminal_state', JSON.stringify(state));
    } catch (error) {
      console.error('Error saving terminal state to storage:', error);
    }
  }
  
  syncFromStorage(newValueStr) {
    if (!newValueStr) return;
    
    try {
      const newState = JSON.parse(newValueStr);
      // Only sync if the change is from another tab (newer timestamp)
      const currentTimestamp = this.lastSaveTimestamp || 0;
      if (newState.timestamp && newState.timestamp > currentTimestamp) {
        if (newState.activeTerminalId) {
          this.activeTerminalId.value = newState.activeTerminalId;
        }
        if (newState.nextTerminalIndex) {
          this.nextTerminalIndex.value = newState.nextTerminalIndex;
        }
      }
    } catch (error) {
      console.error('Error syncing terminal state from storage:', error);
    }
  }
  
  updateSessionClientCount(sessionId, count) {
    const currentMap = new Map(this.sessionClients.value);
    currentMap.set(sessionId, count);
    this.sessionClients.value = currentMap;
    
    // Update terminal objects with client count
    this.terminals.value = this.terminals.value.map(terminal => {
      if (terminal.sessionId === sessionId) {
        return { ...terminal, clientCount: count, lastUpdated: new Date() };
      }
      return terminal;
    });
    
    console.log(`Session ${sessionId} now has ${count} clients`);
  }
  
  handleSessionClosed(sessionId) {
    console.log(`Session ${sessionId} was closed`);
    
    // Update terminals for this session
    this.terminals.value = this.terminals.value.map(terminal => {
      if (terminal.sessionId === sessionId) {
        return { ...terminal, status: 'closed', lastUpdated: new Date() };
      }
      return terminal;
    });
    
    // Remove from session clients
    const currentMap = new Map(this.sessionClients.value);
    currentMap.delete(sessionId);
    this.sessionClients.value = currentMap;
  }

  // Initialize default terminal
  initializeDefaultTerminal() {
    if (this.terminals.value.length === 0) {
      this.addTerminal(1);
    }
  }
}

// Create and export singleton instance
export const terminalStore = new TerminalStore();

// Make it available globally for debugging
if (typeof window !== 'undefined') {
  window.terminalStore = terminalStore;
}

// Initialize default terminal on load
terminalStore.initializeDefaultTerminal();