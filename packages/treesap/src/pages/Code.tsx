import Layout from "../layouts/Layout.js";
import { Terminal as TerminalComponent } from "../components/Terminal.js";
import { SimpleLivePreview } from "../components/SimpleLivePreview.js";

interface TerminalProps {
  previewPort?: number;
  workingDirectory?: string;
}

export function Code({ previewPort = 1234, workingDirectory }: TerminalProps) {
  return (
    <Layout title="Code Editor">
      <div id="code-container" class="h-screen flex bg-[#1e1e1e]">
        {/* Left Pane - Tabbed Sidebar */}
        <div id="sidebar-pane" class="w-2/5-plus border-r border-[#3c3c3c] transition-all duration-300 flex flex-col bg-[#252526]">
          {/* Preview Controls */}
          <div class="p-3 border-b border-[#3c3c3c] bg-[#2d2d30]">
            <div class="flex items-center gap-2">
              <a
                href="/"
                class="p-2 hover:bg-[#3c3c3c] rounded-md transition-colors flex-shrink-0 text-[#cccccc] hover:text-white"
                title="Back to Home"
              >
                <iconify-icon icon="tabler:arrow-left" width="16" height="16"></iconify-icon>
              </a>
              <button
                type="button"
                id="live-preview-refresh-btn"
                class="p-2 hover:bg-[#3c3c3c] rounded-md transition-colors flex-shrink-0 text-[#cccccc] hover:text-white"
                title="Reload"
              >
                <iconify-icon icon="tabler:refresh" width="16" height="16"></iconify-icon>
              </button>
              <div class="flex-1 flex items-center bg-[#1e1e1e] border border-[#3c3c3c] rounded px-3 py-2 hover:border-[#0e639c] focus-within:border-[#0e639c] transition-all">
                <iconify-icon icon="tabler:world" width="16" height="16" class="text-[#cccccc] mr-2"></iconify-icon>
                <span class="text-[#cccccc] text-sm">localhost:{previewPort}/</span>
                <input
                  id="live-preview-url-input"
                  type="text"
                  placeholder="path"
                  defaultValue=""
                  class="flex-1 bg-transparent text-sm focus:outline-none text-[#cccccc] ml-1"
                />
                <button
                  type="button"
                  id="live-preview-load-btn"
                  class="ml-2 p-1 hover:bg-[#3c3c3c] rounded transition-colors flex-shrink-0 text-[#cccccc] hover:text-white"
                  title="Go"
                >
                  <iconify-icon icon="tabler:chevron-right" width="16" height="16"></iconify-icon>
                </button>
              </div>
            </div>
          </div>
          
          {/* Tab Headers */}
          <div class="flex py-2">
            <button class="px-3 py-2 text-[#cccccc] disabled:opacity-50 cursor-not-allowed flex items-center justify-center">
              <iconify-icon icon="tabler:folder" width="20" height="20"></iconify-icon>
            </button>
            <button class="px-3 py-2 text-[#cccccc] disabled:opacity-50 cursor-not-allowed flex items-center justify-center">
              <iconify-icon icon="tabler:search" width="20" height="20"></iconify-icon>
            </button>
            <button class="px-3 py-2 text-white flex items-center justify-center">
              <iconify-icon icon="tabler:terminal" width="20" height="20"></iconify-icon>
            </button>
            <button class="px-3 py-2 text-[#cccccc] disabled:opacity-50 cursor-not-allowed flex items-center justify-center">
              <iconify-icon icon="tabler:git-merge" width="20" height="20"></iconify-icon>
            </button>
          </div>
          
          {/* Tab Content */}
          <div class="flex-1 overflow-hidden bg-[#1e1e1e]">
            {/* Terminal Tab Content (Active) */}
            <div class="h-full flex flex-col">
              
              {/* Terminal Tabs Bar */}
              <div class="border-b border-[#3c3c3c] bg-[#252526] px-3 py-1">
                <div class="flex items-center gap-1">
                  {/* Terminal Tab 1 */}
                  <button
                    id="terminal-tab-1"
                    class="terminal-tab flex items-center px-3 py-1 text-sm text-white bg-[#1e1e1e] border-t-2 border-[#0e639c] rounded-t-sm hover:bg-[#2d2d30] transition-colors"
                    data-terminal-index="1"
                  >
                    <iconify-icon icon="tabler:terminal-2" width="14" height="14" class="mr-1"></iconify-icon>
                    Terminal 1
                    <button class="ml-2 hover:bg-[#3c3c3c] rounded p-0.5 text-[#cccccc] hover:text-white terminal-close-btn" data-terminal-index="1" style="display: none;">
                      <iconify-icon icon="tabler:x" width="12" height="12"></iconify-icon>
                    </button>
                  </button>
                  
                  {/* Terminal Tab 2 */}
                  <button
                    id="terminal-tab-2"
                    class="terminal-tab flex items-center px-3 py-1 text-sm text-[#cccccc] hover:text-white hover:bg-[#2d2d30] transition-colors rounded-t-sm"
                    data-terminal-index="2"
                    style="display: none;"
                  >
                    <iconify-icon icon="tabler:terminal-2" width="14" height="14" class="mr-1"></iconify-icon>
                    Terminal 2
                    <button class="ml-2 hover:bg-[#3c3c3c] rounded p-0.5 text-[#cccccc] hover:text-white terminal-close-btn" data-terminal-index="2">
                      <iconify-icon icon="tabler:x" width="12" height="12"></iconify-icon>
                    </button>
                  </button>
                  
                  {/* Terminal Tab 3 */}
                  <button
                    id="terminal-tab-3"
                    class="terminal-tab flex items-center px-3 py-1 text-sm text-[#cccccc] hover:text-white hover:bg-[#2d2d30] transition-colors rounded-t-sm"
                    data-terminal-index="3"
                    style="display: none;"
                  >
                    <iconify-icon icon="tabler:terminal-2" width="14" height="14" class="mr-1"></iconify-icon>
                    Terminal 3
                    <button class="ml-2 hover:bg-[#3c3c3c] rounded p-0.5 text-[#cccccc] hover:text-white terminal-close-btn" data-terminal-index="3">
                      <iconify-icon icon="tabler:x" width="12" height="12"></iconify-icon>
                    </button>
                  </button>
                  
                  {/* Add Terminal Button */}
                  <button
                    id="add-terminal-btn"
                    class="flex items-center px-2 py-1 text-sm text-[#cccccc] hover:text-white hover:bg-[#2d2d30] transition-colors rounded"
                    title="New Terminal"
                  >
                    <iconify-icon icon="tabler:plus" width="14" height="14"></iconify-icon>
                  </button>
                </div>
              </div>
              
              {/* Terminal Content Area */}
              <div class="flex-1 overflow-hidden relative">
                {/* Terminal 1 Container */}
                <div id="terminal-container-1" class="h-full p-4 terminal-container" data-terminal-index="1">
                  <TerminalComponent index={1} />
                </div>
                
                {/* Terminal 2 Container */}
                <div id="terminal-container-2" class="h-full p-4 terminal-container" data-terminal-index="2" style="display: none;">
                  <TerminalComponent index={2} />
                </div>
                
                {/* Terminal 3 Container */}
                <div id="terminal-container-3" class="h-full p-4 terminal-container" data-terminal-index="3" style="display: none;">
                  <TerminalComponent index={3} />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Right Pane - Live Preview */}
        <SimpleLivePreview id="live-preview" previewPort={previewPort} />
      </div>
      
      {/* Terminal Tabs Management Script */}
      <script type="module" src="/components/TerminalTabs.js"></script>
    </Layout>
  );
}