interface SimpleLivePreviewProps {
  id?: string;
  previewPort?: number;
}

export function SimpleLivePreview({ id = "simple-preview", previewPort = 5173 }: SimpleLivePreviewProps) {
  const defaultSrc = `http://localhost:${previewPort}`;
  const baseUrl = `localhost:${previewPort}/`;
  
  return (
    <sapling-island loading="visible">
      <template>
        <script type="module" src="https://code.iconify.design/iconify-icon/2.0.0/iconify-icon.min.js"></script>
        <script type="module" src="/components/SimpleLivePreview.js"></script>
      </template>

      <div id={id} class="flex-1 h-full flex flex-col bg-white transition-all duration-300">
        {/* URL Bar */}
        <div class="p-3 border-b border-gray-200 bg-white">
          <div class="flex items-center gap-2">
            <button
              id={`${id}-hide-claude-btn`}
              class="p-2 hover:bg-gray-100 rounded-md transition-colors flex items-center"
              title="Hide Terminal"
            >
              <iconify-icon id={`${id}-hide-claude-icon`} icon="ph:sidebar-simple" width="16" height="16"></iconify-icon>
            </button>
            <button
              type="button"
              id={`${id}-refresh-btn`}
              class="p-2 hover:bg-gray-100 rounded-md transition-colors flex-shrink-0"
              title="Reload"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="23 4 23 10 17 10"></polyline>
                <polyline points="1 20 1 14 7 14"></polyline>
                <path d="m3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
              </svg>
            </button>
            <div class="flex-1 flex items-center bg-gray-50 border border-gray-300 rounded-full px-4 py-2 hover:bg-white hover:border-gray-400 focus-within:bg-white focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gray-400 mr-3">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24"></path>
              </svg>
              <span class="text-gray-600 text-sm">{baseUrl}</span>
              <input
                id={`${id}-url-input`}
                type="text"
                placeholder="path"
                defaultValue=""
                class="flex-1 bg-transparent text-sm focus:outline-none text-gray-700 ml-0"
              />
              <button
                type="button"
                id={`${id}-load-btn`}
                class="ml-2 p-1 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
                title="Go"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Iframe */}
        <div class="flex-1 overflow-hidden">
          <iframe
            id={`${id}-iframe`}
            src={defaultSrc}
            class="w-full h-full border-0 bg-white block"
            title="Live Preview"
            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation allow-downloads allow-modals allow-orientation-lock allow-pointer-lock allow-presentation allow-storage-access-by-user-activation"
            data-preview-port={previewPort}
          ></iframe>
        </div>
      </div>
    </sapling-island>
  );
}