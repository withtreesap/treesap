export function VoiceRecorder({ id = "default" }: { id?: string }) {
  return (
    <sapling-island loading="visible">
      <template>
        <script type="module" src="/components/VoiceRecorder.js"></script>
      </template>
      <button 
        id={`voice-recorder-${id}`}
        type="button"
        class="w-10 h-10 bg-black text-white rounded-full hover:bg-gray-800 transition-colors flex items-center justify-center"
        aria-label="Voice recording"
      >
        {/* Microphone icon */}
        <svg id={`mic-icon-${id}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
          <line x1="12" x2="12" y1="19" y2="22"/>
          <line x1="8" x2="16" y1="22" y2="22"/>
        </svg>
        
        {/* Stop icon */}
        <svg id={`stop-icon-${id}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: none;">
          <rect width="18" height="18" x="3" y="3" rx="2" ry="2"/>
        </svg>
        
        {/* Loading spinner */}
        <svg id={`loading-icon-${id}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: none;" class="animate-spin">
          <path d="M21 12a9 9 0 11-6.219-8.56"/>
        </svg>
      </button>
    </sapling-island>
  );
}