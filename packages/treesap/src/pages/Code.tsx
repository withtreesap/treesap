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
          {/* Back to Home */}
          <div class="p-3 border-b border-[#3c3c3c]">
            <a href="/" class="text-[#cccccc] hover:text-white text-sm">← Back to Home</a>
          </div>
          
          {/* Preview Controls */}
          <div class="p-3 border-b border-[#3c3c3c] bg-[#2d2d30]">
            <div class="flex items-center gap-2">
              <button
                id="live-preview-hide-claude-btn"
                class="p-2 hover:bg-[#3c3c3c] rounded-md transition-colors flex items-center text-[#cccccc] hover:text-white"
                title="Hide Sidebar"
              >
                <iconify-icon id="live-preview-hide-claude-icon" icon="ph:sidebar-simple" width="16" height="16"></iconify-icon>
              </button>
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
            <div class="h-full p-4">
              <TerminalComponent 
                id="terminal" 
                sessionId="shared-terminal-session"
              />
            </div>
          </div>
        </div>
        
        {/* Right Pane - Live Preview */}
        <SimpleLivePreview id="live-preview" previewPort={previewPort} />
      </div>
    </Layout>
  );
}