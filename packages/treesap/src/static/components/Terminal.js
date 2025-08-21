// Terminal component JavaScript using Xterm.js with WebSocket
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
    
    // WebSocket connection
    this.websocket = null;
    this.terminal = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000; // Start with 1 second
    
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
    
    // Connect to terminal via WebSocket
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
      // Log the input data for debugging
      console.log('Terminal input (manual typing):', JSON.stringify(data), 'char codes:', data.split('').map(c => c.charCodeAt(0)));
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
    // Send input via WebSocket
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      const message = {
        type: 'input',
        sessionId: this.sessionId,
        terminalId: this.terminalId,
        data: data
      };
      this.websocket.send(JSON.stringify(message));
    } else {
      console.error('WebSocket not connected, cannot send input');
      this.updateStatus('Disconnected');
      terminalStore.updateTerminalStatus(this.terminalId, 'disconnected');
    }
  }

  connectToTerminal() {
    if (this.websocket) {
      this.websocket.close();
    }

    this.updateStatus('Connecting...');
    
    // Create WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/terminal/ws`;
    
    console.log(`Connecting to WebSocket: ${wsUrl}`);
    this.websocket = new WebSocket(wsUrl);
    
    this.websocket.onopen = () => {
      console.log('WebSocket connected, joining terminal session');
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
      
      // Join the terminal session
      const joinMessage = {
        type: 'join',
        sessionId: this.sessionId,
        terminalId: this.terminalId
      };
      this.websocket.send(JSON.stringify(joinMessage));
    };
    
    this.websocket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received WebSocket message:', data.type);
        
        switch (data.type) {
          case 'connected':
            this.updateStatus('Ready');
            terminalStore.updateTerminalStatus(this.terminalId, 'connected');
            console.log('Terminal session joined successfully');
            // Dispatch global status for cross-tab sync
            document.dispatchEvent(new CustomEvent('terminal:global_status', {
              detail: { status: 'connected' }
            }));
            break;
            
          case 'output':
            if (data.content) {
              this.terminal.write(data.content);
            }
            break;
            
          case 'error':
            if (data.content) {
              this.terminal.write(`\x1b[31m${data.content}\x1b[0m`);
            } else if (data.data) {
              this.terminal.write(`\x1b[31m${data.data}\x1b[0m`);
            }
            break;
            
          case 'exit':
            this.terminal.writeln(`\x1b[90mProcess exited with code ${data.code || 0}\x1b[0m`);
            this.terminal.write('\x1b[32m$ \x1b[0m');
            break;
            
          case 'clients_count':
            console.log(`${data.count} clients connected to this session`);
            // Dispatch event for TerminalSignal to handle cross-tab sync
            document.dispatchEvent(new CustomEvent('terminal:clients_count', {
              detail: { 
                sessionId: this.sessionId, 
                count: data.count 
              }
            }));
            break;
            
          case 'session_closed':
            console.log('Terminal session was closed');
            this.updateStatus('Session Closed');
            terminalStore.updateTerminalStatus(this.terminalId, 'closed');
            // Dispatch event for TerminalSignal to handle cross-tab sync
            document.dispatchEvent(new CustomEvent('terminal:session_closed', {
              detail: { 
                sessionId: this.sessionId 
              }
            }));
            break;
            
          case 'pong':
            // Connection health check response
            break;
            
          default:
            console.log('Unknown message type:', data.type, data);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    this.websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.updateStatus('Connection Error');
      terminalStore.updateTerminalStatus(this.terminalId, 'error');
    };
    
    this.websocket.onclose = (event) => {
      console.log('WebSocket closed:', event.code, event.reason);
      this.updateStatus('Disconnected');
      terminalStore.updateTerminalStatus(this.terminalId, 'disconnected');
      
      // Attempt to reconnect with exponential backoff
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${this.reconnectDelay}ms`);
        
        setTimeout(() => {
          this.connectToTerminal();
        }, this.reconnectDelay);
        
        // Exponential backoff: double the delay each time, max 10 seconds
        this.reconnectDelay = Math.min(this.reconnectDelay * 2, 10000);
      } else {
        console.error('Max reconnection attempts reached');
        this.updateStatus('Connection Failed');
        terminalStore.updateTerminalStatus(this.terminalId, 'failed');
      }
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

  async destroy() {
    // Send leave message to WebSocket before closing
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      const leaveMessage = {
        type: 'leave',
        sessionId: this.sessionId,
        terminalId: this.terminalId
      };
      this.websocket.send(JSON.stringify(leaveMessage));
    }
    
    if (this.websocket) {
      this.websocket.close();
    }
    if (this.terminal) {
      this.terminal.dispose();
    }
    
    // Note: We don't destroy the server-side session anymore since other tabs might be using it
    // The WebSocket service will manage session cleanup when all clients disconnect
    
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