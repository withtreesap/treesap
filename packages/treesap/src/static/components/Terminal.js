// Terminal component JavaScript using Xterm.js
import { Terminal } from 'https://cdn.jsdelivr.net/npm/@xterm/xterm@5.5.0/+esm';
import { terminalStore } from '/signals/TerminalSignal.js';
class TerminalManager {
  constructor(terminalId) {
    this.terminalId = terminalId;
    this.container = document.getElementById(terminalId);
    this.xtermContainer = document.getElementById(`${terminalId}-xterm`);
    this.resetBtn = document.getElementById(`${terminalId}-reset-btn`);
    this.status = document.getElementById(`${terminalId}-status`);
    
    // Get terminal data from window
    const terminalData = window[`terminalData_${terminalId.replace(/-/g, '_')}`];
    if (!terminalData) {
      console.error(`No terminal data found for ${terminalId}`);
      return;
    }
    
    this.sessionId = terminalData.sessionId;
    this.index = terminalData.index;
    
    console.log(`Terminal ${terminalId} initialized with:`, terminalData);
    
    // Register terminal in store
    terminalStore.addTerminal(this.index);
    terminalStore.updateTerminalStatus(terminalId, 'connecting');
    
    this.eventSource = null;
    this.terminal = null;
    
    this.init();
  }

  init() {
    console.log('Terminal init called with ID:', this.terminalId);
    console.log('Container found:', !!this.container);
    console.log('Xterm container found:', !!this.xtermContainer);
    
    if (!this.container || !this.xtermContainer) {
      console.error('Terminal containers not found! Looking for ID:', this.terminalId);
      terminalStore.updateTerminalStatus(this.terminalId, 'error');
      return;
    }

    // Initialize Xterm.js
    this.setupXterm();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Connect to terminal stream
    this.connectToTerminal();
  }

  setupXterm() {
    // Create terminal instance with VS Code-like theme
    this.terminal = new Terminal({
      cursorBlink: true,
      fontSize: 12,
      fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
      theme: {
        background: '#1e1e1e',
        foreground: '#cccccc',
        cursor: '#ffffff',
        cursorAccent: '#1e1e1e',
        selection: '#ffffff40',
        black: '#000000',
        red: '#f14c4c',
        green: '#23d18b',
        yellow: '#f5f543',
        blue: '#3b8eea',
        magenta: '#d670d6',
        cyan: '#29b8db',
        white: '#e5e5e5',
        brightBlack: '#666666',
        brightRed: '#f14c4c',
        brightGreen: '#23d18b',
        brightYellow: '#f5f543',
        brightBlue: '#3b8eea',
        brightMagenta: '#d670d6',
        brightCyan: '#29b8db',
        brightWhite: '#ffffff'
      },
      scrollback: 1000,
      tabStopWidth: 4,
      allowTransparency: false
    });

    // Open terminal in container
    this.terminal.open(this.xtermContainer);
    
    // Focus terminal
    this.terminal.focus();

    // Handle terminal input - pass through to shell
    this.terminal.onData((data) => {
      // Send all input directly to the shell session
      this.sendInput(data);
    });

    // Fit terminal to container
    this.fitTerminal();
    
    // Resize handler
    window.addEventListener('resize', () => {
      this.fitTerminal();
    });
  }

  fitTerminal() {
    if (this.terminal && this.xtermContainer) {
      // Wait a moment to ensure container is properly sized
      setTimeout(() => {
        const containerRect = this.xtermContainer.getBoundingClientRect();
        if (containerRect.width > 0 && containerRect.height > 0) {
          const cols = Math.floor(containerRect.width / 7.2); // Approximate character width for 12px font
          const rows = Math.floor(containerRect.height / 14.4); // Approximate line height for 12px font
          console.log(`Fitting terminal ${this.terminalId}: ${cols}x${rows} (container: ${containerRect.width}x${containerRect.height})`);
          this.terminal.resize(cols, rows);
        } else {
          console.warn(`Terminal ${this.terminalId} container has zero dimensions, retrying...`);
          // Retry after a short delay
          setTimeout(() => this.fitTerminal(), 100);
        }
      }, 10);
    }
  }

  setupEventListeners() {
    // Handle reset button
    if (this.resetBtn) {
      this.resetBtn.addEventListener('click', () => {
        this.clearTerminal();
      });
    }
  }

  sendInput(data) {
    // Send input directly to shell stdin
    fetch(`/terminal/input/${this.sessionId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ input: data })
    })
    .catch(error => {
      console.error('Error sending input:', error);
    });
  }

  connectToTerminal() {
    if (this.eventSource) {
      this.eventSource.close();
    }

    this.updateStatus('Connecting...');
    
    this.eventSource = new EventSource(`/terminal/stream/${this.sessionId}`);
    
    this.eventSource.onopen = () => {
      this.updateStatus('Ready');
      terminalStore.updateTerminalStatus(this.terminalId, 'connected');
    };
    
    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'output') {
          this.terminal.write(data.content);
        } else if (data.type === 'error') {
          this.terminal.write(`\x1b[31m${data.content}\x1b[0m`);
        } else if (data.type === 'exit') {
          this.terminal.writeln(`\x1b[90mProcess exited with code ${data.code}\x1b[0m`);
          this.terminal.write('\x1b[32m$ \x1b[0m');
        } else if (data.type === 'connected') {
          // Terminal connected - shell will show its own prompt
          console.log('Terminal connected');
        }
      } catch (error) {
        console.error('Error parsing terminal data:', error);
      }
    };
    
    this.eventSource.onerror = (error) => {
      console.error('Terminal stream error:', error);
      this.updateStatus('Disconnected');
      terminalStore.updateTerminalStatus(this.terminalId, 'disconnected');
      
      // Attempt to reconnect after a delay
      setTimeout(() => {
        if (this.eventSource.readyState === EventSource.CLOSED) {
          terminalStore.updateTerminalStatus(this.terminalId, 'connecting');
          this.connectToTerminal();
        }
      }, 3000);
    };
  }

  updateStatus(status) {
    if (this.status) {
      this.status.textContent = status;
    }
  }

  clearTerminal() {
    if (this.terminal) {
      this.terminal.clear();
      this.terminal.writeln('\x1b[36mTerminal cleared\x1b[0m');
      this.terminal.write('\x1b[32m$ \x1b[0m');
    }
  }

  destroy() {
    if (this.eventSource) {
      this.eventSource.close();
    }
    if (this.terminal) {
      this.terminal.dispose();
    }
    // Remove from store
    terminalStore.removeTerminal(this.terminalId);
  }
}

// Auto-initialize when script loads
console.log('Terminal.js loaded, looking for terminal containers...');
let terminalManagers = new Map();

function initializeTerminals() {
  // Look for all sapling-islands and find the ones with terminal content
  const saplingIslands = document.querySelectorAll('sapling-island');
  
  for (const island of saplingIslands) {
    // Look for a div with bg-gray-900 class (terminal styling)
    const terminalDiv = island.querySelector('div.bg-gray-900[id]');
    if (terminalDiv && terminalDiv.id && terminalDiv.id.startsWith('terminal-')) {
      const terminalId = terminalDiv.id;
      console.log('Found terminal component with ID:', terminalId);
      
      // Check if we already have a manager for this terminal
      if (!terminalManagers.has(terminalId)) {
        const manager = new TerminalManager(terminalId);
        terminalManagers.set(terminalId, manager);
      }
    }
  }
  
  console.log(`Initialized ${terminalManagers.size} terminal(s)`);
}

// Try immediate initialization
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeTerminals);
} else {
  initializeTerminals();
}

// Make available globally
window.terminalManagers = terminalManagers;
window.TerminalManager = TerminalManager;
window.initializeTerminals = initializeTerminals;

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  for (const manager of terminalManagers.values()) {
    manager.destroy();
  }
});