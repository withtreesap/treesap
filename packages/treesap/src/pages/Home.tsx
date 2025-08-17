import Layout from "../layouts/Layout.js";
import { Terminal as TerminalComponent } from "../components/Terminal.js";
import { SimpleLivePreview } from "../components/SimpleLivePreview.js";

interface TerminalProps {
  previewPort?: number;
  workingDirectory?: string;
}

export function Home({ previewPort = 1234, workingDirectory }: TerminalProps) {
  return (
    <Layout title="Terminal">
      <div id="terminal-container" class="h-screen flex">
        {/* Left Pane - Terminal */}
        <div id="terminal-pane" class="w-2/5 border-r border-gray-200 transition-all duration-300">
          <TerminalComponent 
            id="terminal" 
            sessionId="shared-terminal-session"
          />
        </div>
        
        {/* Right Pane - Live Preview */}
        <SimpleLivePreview id="live-preview" previewPort={previewPort} />
      </div>
    </Layout>
  );
}