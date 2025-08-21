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
          
          
          {/* Tab Content */}
          <div class="flex-1 overflow-hidden bg-[#1e1e1e]">
            {/* Single Terminal Content */}
            <div class="h-full">
              <TerminalComponent index={1} />
            </div>
          </div>
        </div>
        
        {/* Right Pane - Live Preview */}
        <SimpleLivePreview id="live-preview" previewPort={previewPort} />
      </div>
    </Layout>
  );
}