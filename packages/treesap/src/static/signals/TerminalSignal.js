import { signal, computed } from 'https://esm.sh/@preact/signals@1.2.2';

// Terminal state management for multiple terminals
class TerminalStore {
  constructor() {
    // Core state signals
    this.terminals = signal([]);  // Array of terminal objects: {id, sessionId, status, index}
    this.activeTerminalId = signal('terminal-1'); // Currently active terminal
    this.nextTerminalIndex = signal(1); // For generating new terminal indices
    
    // Computed values
    this.activeTerminal = computed(() => 
      this.terminals.value.find(t => t.id === this.activeTerminalId.value)
    );
    this.terminalCount = computed(() => this.terminals.value.length);
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