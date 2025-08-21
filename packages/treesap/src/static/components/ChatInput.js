// ChatInput component JavaScript for chat-style terminal input
class ChatInputManager {
  constructor(chatInputId) {
    this.chatInputId = chatInputId;
    this.container = document.getElementById(chatInputId);
    this.textarea = document.getElementById(`${chatInputId}-textarea`);
    this.sendBtn = document.getElementById(`${chatInputId}-send-btn`);
    this.executeBtn = document.getElementById(`${chatInputId}-execute-btn`);
    
    // Get chat input data from window
    const chatInputData = window[`chatInputData_${chatInputId.replace(/-/g, '_')}`];
    if (!chatInputData) {
      console.error(`No chat input data found for ${chatInputId}`);
      return;
    }
    
    this.terminalId = chatInputData.terminalId;
    
    console.log(`ChatInput ${chatInputId} initialized for terminal:`, this.terminalId);
    
    this.init();
  }

  init() {
    if (!this.container || !this.textarea || !this.sendBtn || !this.executeBtn) {
      console.error('ChatInput elements not found!', {
        container: !!this.container,
        textarea: !!this.textarea,
        sendBtn: !!this.sendBtn,
        executeBtn: !!this.executeBtn
      });
      return;
    }

    this.setupEventListeners();
    this.setupAutoResize();
  }

  setupEventListeners() {
    // Handle send to input button click
    this.sendBtn.addEventListener('click', () => {
      this.sendToInput();
    });

    // Handle execute button click
    this.executeBtn.addEventListener('click', () => {
      this.executeCommand();
    });

    // Handle textarea key events
    this.textarea.addEventListener('keydown', (e) => {
      // Enter without shift sends to input field
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendToInput();
      }
      // Ctrl+Enter or Cmd+Enter executes
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        this.executeCommand();
      }
      // Allow Shift+Enter for new lines (default behavior)
    });

    // Handle input to auto-resize textarea
    this.textarea.addEventListener('input', () => {
      this.adjustTextareaHeight();
    });

    // Disable buttons when textarea is empty
    this.textarea.addEventListener('input', () => {
      this.updateButtonState();
    });

    // Focus textarea when container is clicked
    this.container.addEventListener('click', (e) => {
      if (e.target === this.container) {
        this.textarea.focus();
      }
    });
  }

  setupAutoResize() {
    // Initial state
    this.adjustTextareaHeight();
    this.updateButtonState();
  }

  adjustTextareaHeight() {
    if (!this.textarea) return;

    // Reset height to auto to get the correct scrollHeight
    this.textarea.style.height = 'auto';
    
    // Calculate the new height based on content
    const scrollHeight = this.textarea.scrollHeight;
    const maxHeight = 120; // Max height from CSS
    const minHeight = 40;  // Min height from CSS
    
    const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);
    this.textarea.style.height = `${newHeight}px`;
  }

  updateButtonState() {
    if (!this.textarea || !this.sendBtn || !this.executeBtn) return;

    const hasContent = this.textarea.value.trim().length > 0;
    this.sendBtn.disabled = !hasContent;
    this.executeBtn.disabled = false; // Execute button is always enabled
  }

  sendToInput() {
    if (!this.textarea) return;

    const input = this.textarea.value.trim();
    if (!input) return;

    // Get the terminal manager for the associated terminal
    const terminalManager = this.getTerminalManager();
    if (!terminalManager) {
      console.error(`No terminal manager found for terminal: ${this.terminalId}`);
      return;
    }

    // Send the input to the terminal input field (without executing)
    console.log(`Sending text to terminal input field ${this.terminalId}:`, input);
    console.log('ChatInput sending (programmatic):', JSON.stringify(input), 'char codes:', input.split('').map(c => c.charCodeAt(0)));
    
    // Simplest approach: just send the text directly
    // This should work for most cases in Claude Code
    terminalManager.sendInput(input);

    // Clear the textarea
    this.textarea.value = '';
    this.adjustTextareaHeight();
    this.updateButtonState();
    
    // Focus back to textarea for next input
    this.textarea.focus();
  }

  executeCommand() {
    // Get the terminal manager for the associated terminal
    const terminalManager = this.getTerminalManager();
    if (!terminalManager) {
      console.error(`No terminal manager found for terminal: ${this.terminalId}`);
      return;
    }

    // Execute whatever is currently in the terminal input field
    console.log(`Executing command in terminal ${this.terminalId}`);
    console.log('ChatInput executing (programmatic):', JSON.stringify('\r'), 'char code:', '\r'.charCodeAt(0));
    terminalManager.sendInput('\r');
  }

  getTerminalManager() {
    // Access global terminal managers
    if (window.terminalManagers && window.terminalManagers.has(this.terminalId)) {
      return window.terminalManagers.get(this.terminalId);
    }

    // Fallback: try to find by checking all managers
    if (window.terminalManagers) {
      for (const [terminalId, manager] of window.terminalManagers.entries()) {
        if (terminalId === this.terminalId) {
          return manager;
        }
      }
    }

    // If not found, log available terminals for debugging
    if (window.terminalManagers) {
      console.log('Available terminal managers:', Array.from(window.terminalManagers.keys()));
      console.log('Looking for terminal ID:', this.terminalId);
    } else {
      console.log('No terminal managers found in window object');
    }

    return null;
  }

  focus() {
    if (this.textarea) {
      this.textarea.focus();
    }
  }

  destroy() {
    // Clean up event listeners if needed
    // The component will be removed from DOM, so most cleanup is automatic
  }
}

// Auto-initialize when script loads
console.log('ChatInput.js loaded, looking for chat input containers...');
let chatInputManagers = new Map();

function initializeChatInputs() {
  // Look for all sapling-islands with chat input content
  const saplingIslands = document.querySelectorAll('sapling-island');
  
  for (const island of saplingIslands) {
    // Look for chat input container
    const chatInputDiv = island.querySelector('div[id*="chat-input"]');
    if (chatInputDiv && chatInputDiv.id) {
      const chatInputId = chatInputDiv.id;
      console.log('Found chat input component with ID:', chatInputId);
      
      // Check if we already have a manager for this chat input
      if (!chatInputManagers.has(chatInputId)) {
        const manager = new ChatInputManager(chatInputId);
        chatInputManagers.set(chatInputId, manager);
      }
    }
  }
  
  console.log(`Initialized ${chatInputManagers.size} chat input(s)`);
}

// Try immediate initialization
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeChatInputs);
} else {
  initializeChatInputs();
}

// Make available globally
window.chatInputManagers = chatInputManagers;
window.ChatInputManager = ChatInputManager;
window.initializeChatInputs = initializeChatInputs;

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  for (const manager of chatInputManagers.values()) {
    manager.destroy();
  }
});