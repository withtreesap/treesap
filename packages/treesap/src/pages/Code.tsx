import Layout from "../layouts/Layout.js";
import { Sidebar } from "../components/Sidebar.js";
import { SimpleLivePreview } from "../components/SimpleLivePreview.js";

interface TerminalProps {
  previewPort?: number;
  workingDirectory?: string;
}

export function Code({ previewPort = 1234, workingDirectory }: TerminalProps) {
  return (
    <Layout title="Code Editor">
      <div id="code-container" class="h-screen flex bg-[#1e1e1e] relative">
        {/* Mobile toggle button */}
        <button
          type="button"
          id="mobile-sidebar-toggle"
          class="fixed top-4 left-4 z-60 p-3 bg-[#2d2d30] border border-[#3c3c3c] rounded-lg shadow-xl hover:bg-[#3c3c3c] transition-all md:hidden"
          title="Toggle Sidebar"
        >
          <iconify-icon icon="tabler:menu-2" width="20" height="20" class="text-[#cccccc]"></iconify-icon>
        </button>

        {/* Sidebar */}
        <Sidebar id="sidebar" previewPort={previewPort} workingDirectory={workingDirectory} />
        
        {/* Main Content - Live Preview */}
        <div class="flex-1 md:flex-1">
          <SimpleLivePreview id="live-preview" previewPort={previewPort} />
        </div>
      </div>
    </Layout>
  );
}