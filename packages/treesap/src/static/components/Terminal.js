// Terminal component JavaScript using Xterm.js
import { Terminal } from 'https://cdn.jsdelivr.net/npm/@xterm/xterm@5.5.0/+esm';
class TerminalManager {
  constructor(id = 'terminal') {
    this.id = id;
    this.container = document.getElementById(id);
    this.xtermContainer = document.getElementById(`${id}-xterm`);
    this.resetBtn = document.getElementById(`${id}-reset-btn`);
    this.status = document.getElementById(`${id}-status`);
    
    // Check for passed sessionId, otherwise generate one
    const passedSessionId = window[`terminalSessionId_${id.replace(/-/g, '_')}`];
    this.sessionId = passedSessionId || this.generateSessionId();
    console.log(`Terminal ${id} using sessionId:`, this.sessionId);
    
    this.eventSource = null;
    this.terminal = null;
    
    // Share session ID globally for Claude Controller
    if (typeof window !== 'undefined') {
      window.sharedTerminalSessionId = this.sessionId;
      console.log('Terminal session ID shared:', this.sessionId);
    }
    
    this.init();
  }

  generateSessionId() {
    return 'terminal_' + Math.random().toString(36).substr(2, 9);
  }

  init() {
    console.log('Terminal init called with ID:', this.id);
    console.log('Container found:', !!this.container);
    console.log('Xterm container found:', !!this.xtermContainer);
    
    if (!this.container || !this.xtermContainer) {
      console.error('Terminal containers not found! Looking for ID:', this.id);
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
      const containerRect = this.xtermContainer.getBoundingClientRect();
      const cols = Math.floor(containerRect.width / 7.2); // Approximate character width for 12px font
      const rows = Math.floor(containerRect.height / 14.4); // Approximate line height for 12px font
      this.terminal.resize(cols, rows);
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
      
      // Attempt to reconnect after a delay
      setTimeout(() => {
        if (this.eventSource.readyState === EventSource.CLOSED) {
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
  }
}

// Auto-initialize when script loads
console.log('Terminal.js loaded, looking for terminal container...');
let terminalManager;

function initializeTerminal() {
  // Look for all sapling-islands and find the one with terminal content
  const saplingIslands = document.querySelectorAll('sapling-island');
  let terminalId = 'terminal'; // default
  
  for (const island of saplingIslands) {
    // Look for a div with bg-gray-900 class (terminal styling)
    const terminalDiv = island.querySelector('div.bg-gray-900[id]');
    if (terminalDiv && terminalDiv.id) {
      terminalId = terminalDiv.id;
      console.log('Found terminal component with ID:', terminalId);
      break;
    }
  }
  
  console.log('Using terminal ID:', terminalId);
  terminalManager = new TerminalManager(terminalId);
}

// Try immediate initialization
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeTerminal);
} else {
  initializeTerminal();
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (terminalManager) {
    terminalManager.destroy();
  }
});