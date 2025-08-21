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

      <div id={id} class="flex-1 h-full bg-white transition-all duration-300 p-2 relative overflow-hidden">
        {/* Iframe - Full Height */}
        <iframe
          id={`${id}-iframe`}
          src={defaultSrc}
          class="w-full h-full border border-gray-300 bg-white block rounded-md"
          title="Live Preview"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation allow-downloads allow-modals allow-orientation-lock allow-pointer-lock allow-presentation allow-storage-access-by-user-activation"
          data-preview-port={previewPort}
        ></iframe>
        
        {/* Floating Sidebar Toggle - Only show when sidebar is closed */}
        <button
          id={`${id}-floating-hide-sidebar-btn`}
          class="absolute p-3 bg-white border-2 border-gray-400 rounded-lg shadow-xl hover:bg-gray-50 hover:shadow-2xl transition-all items-center justify-center z-50 hidden"
          title="Show Sidebar"
          style="position: absolute !important; z-index: 9999 !important; bottom: 16px; left: 16px;"
        >
          <iconify-icon id={`${id}-floating-hide-sidebar-icon`} icon="ph:sidebar-simple-fill" width="20" height="20" class="text-gray-800"></iconify-icon>
        </button>
      </div>
    </sapling-island>
  );
}