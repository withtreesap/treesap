interface TerminalProps {
  id?: string;
  index?: number;
}

export function Terminal({ id, index = 1 }: TerminalProps) {
  const terminalId = id || `terminal-${index}`;
  const sessionId = `terminal-${index}`;
  return (
    <sapling-island loading="visible">
      <template>
        <link href="https://cdn.jsdelivr.net/npm/@xterm/xterm@5.5.0/css/xterm.min.css" rel="stylesheet" />
        <script type="module" src="/components/Terminal.js"></script>
      </template>
      
      <div id={terminalId} class="h-full bg-gray-900 flex font-sans overflow-hidden">
        {/* Terminal Interface */}
        <div class="w-full flex flex-col bg-gray-900 relative">
          {/* Terminal header */}
          <div id={`${terminalId}-container`} class="h-full flex flex-col">
            
            {/* Xterm.js terminal container */}
            <div class="flex-1 overflow-hidden">
              <div id={`${terminalId}-xterm`} class="h-full w-full"></div>
            </div>
          </div>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{__html: `
        // Pass terminal data to JavaScript
        window.terminalData_${terminalId.replace(/-/g, '_')} = {
          terminalId: '${terminalId}',
          sessionId: '${sessionId}',
          index: ${index}
        };
      `}}></script>
    </sapling-island>
  );
}