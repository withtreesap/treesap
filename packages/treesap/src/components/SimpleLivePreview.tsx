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

      <div id={id} class="flex-1 h-full bg-white transition-all duration-300">
        {/* Iframe - Full Height */}
        <iframe
          id={`${id}-iframe`}
          src={defaultSrc}
          class="w-full h-full border-0 bg-white block"
          title="Live Preview"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation allow-downloads allow-modals allow-orientation-lock allow-pointer-lock allow-presentation allow-storage-access-by-user-activation"
          data-preview-port={previewPort}
        ></iframe>
      </div>
    </sapling-island>
  );
}