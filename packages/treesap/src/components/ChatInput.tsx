interface ChatInputProps {
  id?: string;
  terminalId?: string;
}

export function ChatInput({ id = "chat-input", terminalId = "terminal-1" }: ChatInputProps) {
  return (
    <sapling-island loading="visible">
      <template>
        <script type="module" src="/components/ChatInput.js"></script>
      </template>
      
      <div id={id} class="border-t border-[#3c3c3c] bg-[#2d2d30] p-3">
        <div class="flex items-end gap-2">
          {/* Textarea for multi-line input */}
          <div class="flex-1 relative">
            <textarea
              id={`${id}-textarea`}
              placeholder="Type your command or message..."
              class="w-full min-h-[40px] max-h-[120px] px-3 py-2 bg-[#1e1e1e] border border-[#3c3c3c] rounded-lg text-[#cccccc] placeholder-[#888] resize-none focus:outline-none focus:border-[#0e639c] transition-colors text-sm font-mono"
              rows={1}
            ></textarea>
          </div>
          
          {/* Send to Input button */}
          <button
            type="button"
            id={`${id}-send-btn`}
            class="px-3 py-2 bg-[#0e639c] hover:bg-[#1177bb] disabled:bg-[#3c3c3c] disabled:text-[#888] text-white rounded-lg transition-colors flex-shrink-0 flex items-center justify-center min-h-[40px]"
            title="Send to Input Field"
          >
            <iconify-icon icon="tabler:arrow-up" width="16" height="16"></iconify-icon>
          </button>
          
          {/* Execute button */}
          <button
            type="button"
            id={`${id}-execute-btn`}
            class="px-3 py-2 bg-[#28a745] hover:bg-[#218838] disabled:bg-[#3c3c3c] disabled:text-[#888] text-white rounded-lg transition-colors flex-shrink-0 flex items-center justify-center min-h-[40px]"
            title="Execute Command"
          >
            <iconify-icon icon="tabler:player-play" width="16" height="16"></iconify-icon>
          </button>
        </div>
      </div>

      <script dangerouslySetInnerHTML={{__html: `
        // Pass chat input data to JavaScript
        window.chatInputData_${id.replace(/-/g, '_')} = {
          chatInputId: '${id}',
          terminalId: '${terminalId}'
        };
      `}}></script>
    </sapling-island>
  );
}