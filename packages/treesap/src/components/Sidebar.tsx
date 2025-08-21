import { Terminal as TerminalComponent } from "./Terminal.js";

interface SidebarProps {
  id?: string;
  previewPort?: number;
  workingDirectory?: string;
}

export function Sidebar({ id = "sidebar", previewPort = 1234, workingDirectory }: SidebarProps) {
  return (
    <sapling-island loading="visible">
      <template>
        <script type="module" src="https://code.iconify.design/iconify-icon/2.0.0/iconify-icon.min.js"></script>
        <script type="module" src="/components/Sidebar.js"></script>
      </template>

      {/* Mobile backdrop */}
      <div 
        id={`${id}-backdrop`}
        class="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-40 transition-opacity duration-300 opacity-0 pointer-events-none md:hidden"
      ></div>

      {/* Sidebar container */}
      <div 
        id={`${id}-pane`}
        class="fixed left-0 top-0 h-full w-full z-50 transform -translate-x-full transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:w-2/5 md:z-auto border-r border-[#3c3c3c] flex flex-col bg-[#252526]"
      >
        {/* Preview Controls */}
        <div class="p-3 border-b border-[#3c3c3c] bg-[#2d2d30] flex-shrink-0">
          <div class="flex items-center gap-2">
            {/* Mobile close button */}
            <button
              type="button"
              id={`${id}-close-btn`}
              class="p-2 hover:bg-[#3c3c3c] rounded-md transition-colors flex-shrink-0 text-[#cccccc] hover:text-white md:hidden"
              title="Close Sidebar"
            >
              <iconify-icon icon="tabler:x" width="16" height="16"></iconify-icon>
            </button>
            
            {/* Back to Home */}
            <a
              href="/"
              class="p-2 hover:bg-[#3c3c3c] rounded-md transition-colors flex-shrink-0 text-[#cccccc] hover:text-white"
              title="Back to Home"
            >
              <iconify-icon icon="tabler:arrow-left" width="16" height="16"></iconify-icon>
            </a>
            
            {/* Refresh button */}
            <button
              type="button"
              id="live-preview-refresh-btn"
              class="p-2 hover:bg-[#3c3c3c] rounded-md transition-colors flex-shrink-0 text-[#cccccc] hover:text-white"
              title="Reload"
            >
              <iconify-icon icon="tabler:refresh" width="16" height="16"></iconify-icon>
            </button>
            
            {/* URL input */}
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
        
        {/* Terminal Content */}
        <div class="flex-1 overflow-hidden bg-[#1e1e1e]">
          <div class="h-full">
            <TerminalComponent index={1} />
          </div>
        </div>
      </div>
    </sapling-island>
  );
}