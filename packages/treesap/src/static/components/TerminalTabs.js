// Terminal tabs management
import { terminalStore } from '/signals/TerminalSignal.js';

class TerminalTabManager {
  constructor() {
    this.maxTerminals = 3;
    this.activeTerminalIndex = 1;
    
    this.init();
  }

  init() {
    console.log('TerminalTabManager initialized');
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Subscribe to terminal store changes
    this.subscribeToStore();
    
    // Initialize first terminal
    this.showTerminal(1);
    
    // Update button visibility
    this.updateAddButtonVisibility();
    this.updateCloseButtonsVisibility();
  }
  
  setupEventListeners() {
    // Terminal tab click handlers
    for (let i = 1; i <= this.maxTerminals; i++) {
      const tabBtn = document.getElementById(`terminal-tab-${i}`);
      if (tabBtn) {
        tabBtn.addEventListener('click', (e) => {
          // Prevent event bubbling to close button
          if (!e.target.closest('.terminal-close-btn')) {
            this.switchToTerminal(i);
          }
        });
      }
      
      // Close button handlers
      const closeBtns = document.querySelectorAll(`[data-terminal-index="${i}"].terminal-close-btn`);
      closeBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.closeTerminal(i);
        });
      });
    }
    
    // Add terminal button
    const addBtn = document.getElementById('add-terminal-btn');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        this.addTerminal();
      });
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      // Ctrl+Shift+` to create new terminal
      if (e.ctrlKey && e.shiftKey && e.code === 'Backquote') {
        e.preventDefault();
        this.addTerminal();
      }
      
      // Ctrl+Shift+W to close current terminal
      if (e.ctrlKey && e.shiftKey && e.key === 'W') {
        e.preventDefault();
        this.closeTerminal(this.activeTerminalIndex);
      }
    });
    
    // Window resize handler to fit terminals
    window.addEventListener('resize', () => {
      // Resize the currently active terminal
      setTimeout(() => {
        if (window.terminalManagers) {
          const activeManager = window.terminalManagers.get(`terminal-${this.activeTerminalIndex}`);
          if (activeManager && activeManager.terminal) {
            activeManager.fitTerminal();
            console.log(`Resized active terminal-${this.activeTerminalIndex} due to window resize`);
          }
        }
      }, 100);
    });
  }
  
  subscribeToStore() {
    // Watch for active terminal changes in the store
    terminalStore.activeTerminalId.subscribe((terminalId) => {
      if (terminalId) {
        const match = terminalId.match(/terminal-(\d+)/);
        if (match) {
          const index = parseInt(match[1]);
          this.updateActiveTabVisual(index);
        }
      }
    });
  }
  
  switchToTerminal(index) {
    if (index < 1 || index > this.maxTerminals) return;
    
    console.log(`Switching to terminal ${index}`);
    
    // Update store
    terminalStore.setActiveTerminal(`terminal-${index}`);
    
    // Show the terminal
    this.showTerminal(index);
    
    // Update active index
    this.activeTerminalIndex = index;
  }
  
  showTerminal(index) {
    // Hide all terminal containers
    for (let i = 1; i <= this.maxTerminals; i++) {
      const container = document.getElementById(`terminal-container-${i}`);
      if (container) {
        container.style.display = 'none';
      }
    }
    
    // Show the active terminal container
    const activeContainer = document.getElementById(`terminal-container-${index}`);
    if (activeContainer) {
      activeContainer.style.display = 'block';
    }
    
    // Update tab visuals
    this.updateActiveTabVisual(index);
    
    // Focus and resize the terminal
    setTimeout(() => {
      const terminalElement = document.getElementById(`terminal-${index}-xterm`);
      if (terminalElement && window.terminalManagers) {
        const manager = window.terminalManagers.get(`terminal-${index}`);
        if (manager && manager.terminal) {
          // Fit the terminal to its container
          manager.fitTerminal();
          // Focus the terminal
          manager.terminal.focus();
          console.log(`Focused and resized terminal-${index}`);
        } else {
          console.warn(`Terminal manager not found for terminal-${index}`);
        }
      }
    }, 150);
  }
  
  updateActiveTabVisual(activeIndex) {
    for (let i = 1; i <= this.maxTerminals; i++) {
      const tab = document.getElementById(`terminal-tab-${i}`);
      if (tab) {
        if (i === activeIndex) {
          // Active tab styling
          tab.className = 'terminal-tab flex items-center px-3 py-1 text-sm text-white bg-[#1e1e1e] border-t-2 border-[#0e639c] rounded-t-sm hover:bg-[#2d2d30] transition-colors';
        } else {
          // Inactive tab styling
          tab.className = 'terminal-tab flex items-center px-3 py-1 text-sm text-[#cccccc] hover:text-white hover:bg-[#2d2d30] transition-colors rounded-t-sm';
        }
      }
    }
  }
  
  addTerminal() {
    // Find the next available terminal slot
    for (let i = 2; i <= this.maxTerminals; i++) {
      const tab = document.getElementById(`terminal-tab-${i}`);
      const container = document.getElementById(`terminal-container-${i}`);
      
      if (tab && container && tab.style.display === 'none') {
        console.log(`Adding terminal ${i}`);
        
        // Show the tab
        tab.style.display = 'flex';
        
        // Add to store
        terminalStore.addTerminal(i);
        
        // Show the container temporarily to allow terminal initialization
        container.style.display = 'block';
        
        // Initialize the terminal by triggering the terminal manager to look for new terminals
        setTimeout(() => {
          if (window.initializeTerminals) {
            window.initializeTerminals();
          }
          
          // Switch to the new terminal after initialization (this will handle hiding/showing properly)
          setTimeout(() => {
            this.switchToTerminal(i);
            
            // Force a resize after switching
            setTimeout(() => {
              if (window.terminalManagers) {
                const manager = window.terminalManagers.get(`terminal-${i}`);
                if (manager && manager.terminal) {
                  manager.fitTerminal();
                  console.log(`Force-resized new terminal-${i}`);
                }
              }
            }, 100);
          }, 200);
        }, 100);
        
        // Update add button visibility
        this.updateAddButtonVisibility();
        
        // Show close button for new terminal (except terminal 1)
        this.updateCloseButtonsVisibility();
        
        return;
      }
    }
    
    console.log('Maximum number of terminals reached');
  }
  
  closeTerminal(index) {
    if (index === 1) {
      console.log('Cannot close terminal 1');
      return; // Can't close the first terminal
    }
    
    console.log(`Closing terminal ${index}`);
    
    const tab = document.getElementById(`terminal-tab-${index}`);
    const container = document.getElementById(`terminal-container-${index}`);
    
    if (tab && container) {
      // Hide the tab and container
      tab.style.display = 'none';
      container.style.display = 'none';
      
      // Remove from store
      terminalStore.removeTerminal(`terminal-${index}`);
      
      // If we're closing the active terminal, switch to another one
      if (this.activeTerminalIndex === index) {
        // Find the next available terminal
        for (let i = 1; i <= this.maxTerminals; i++) {
          const nextTab = document.getElementById(`terminal-tab-${i}`);
          if (nextTab && nextTab.style.display !== 'none') {
            this.switchToTerminal(i);
            break;
          }
        }
      }
      
      // Update add button visibility
      this.updateAddButtonVisibility();
      
      // Update close button visibility
      this.updateCloseButtonsVisibility();
    }
  }
  
  updateAddButtonVisibility() {
    const addBtn = document.getElementById('add-terminal-btn');
    if (!addBtn) return;
    
    // Count visible terminals
    let visibleCount = 0;
    for (let i = 1; i <= this.maxTerminals; i++) {
      const tab = document.getElementById(`terminal-tab-${i}`);
      if (tab && tab.style.display !== 'none') {
        visibleCount++;
      }
    }
    
    // Hide add button if we have max terminals
    addBtn.style.display = visibleCount >= this.maxTerminals ? 'none' : 'flex';
  }
  
  updateCloseButtonsVisibility() {
    // Count visible terminals
    let visibleCount = 0;
    for (let i = 1; i <= this.maxTerminals; i++) {
      const tab = document.getElementById(`terminal-tab-${i}`);
      if (tab && tab.style.display !== 'none') {
        visibleCount++;
      }
    }
    
    // Show/hide close buttons - never show on terminal 1, only show on others if more than 1 terminal
    for (let i = 1; i <= this.maxTerminals; i++) {
      const closeBtns = document.querySelectorAll(`[data-terminal-index="${i}"].terminal-close-btn`);
      closeBtns.forEach(btn => {
        if (i === 1) {
          // Never show close button on Terminal 1
          btn.style.display = 'none';
        } else {
          // Show close button on other terminals only if there are multiple terminals
          const tab = document.getElementById(`terminal-tab-${i}`);
          if (tab && tab.style.display !== 'none' && visibleCount > 1) {
            btn.style.display = 'inline-flex';
          } else {
            btn.style.display = 'none';
          }
        }
      });
    }
  }
  
  // Get current state
  getState() {
    const visibleTerminals = [];
    for (let i = 1; i <= this.maxTerminals; i++) {
      const tab = document.getElementById(`terminal-tab-${i}`);
      if (tab && tab.style.display !== 'none') {
        visibleTerminals.push(i);
      }
    }
    
    return {
      visibleTerminals,
      activeTerminalIndex: this.activeTerminalIndex,
      maxTerminals: this.maxTerminals
    };
  }
}

// Auto-initialize when script loads
let terminalTabManager;

function initializeTerminalTabs() {
  // Wait for DOM elements to be ready
  const terminalTab1 = document.getElementById('terminal-tab-1');
  if (terminalTab1) {
    console.log('Initializing TerminalTabManager...');
    terminalTabManager = new TerminalTabManager();
  } else {
    console.log('Terminal tabs not found, retrying...');
    setTimeout(initializeTerminalTabs, 100);
  }
}

// Initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeTerminalTabs);
} else {
  initializeTerminalTabs();
}

// Make available globally
window.terminalTabManager = terminalTabManager;
window.TerminalTabManager = TerminalTabManager;

export default TerminalTabManager;