interface TerminalProps {
  id?: string;
  sessionId?: string;
}

export function Terminal({ id = "terminal", sessionId }: TerminalProps) {
  return (
    <sapling-island loading="visible">
      <template>
        <link href="https://cdn.jsdelivr.net/npm/@xterm/xterm@5.5.0/css/xterm.min.css" rel="stylesheet" />
        <script type="module" src="/components/Terminal.js"></script>
      </template>
      
      <div id={id} class="h-full bg-gray-900 flex font-sans overflow-hidden">
        {/* Terminal Interface */}
        <div class="w-full flex flex-col bg-gray-900 relative">
          {/* Terminal header */}
          <div id={`${id}-container`} class="h-full flex flex-col">
            
            {/* Xterm.js terminal container */}
            <div class="flex-1 overflow-hidden">
              <div id={`${id}-xterm`} class="h-full w-full"></div>
            </div>
          </div>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{__html: `
        // Pass sessionId to terminal if provided
        window.terminalSessionId_${id.replace(/-/g, '_')} = '${sessionId || ''}';
      `}}></script>
    </sapling-island>
  );
}