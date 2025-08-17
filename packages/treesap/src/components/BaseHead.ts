import { html } from "hono/html";

export function BaseHead({
  title = "Treesap",
  description = "Treesap - A modern AI chat application built with Sapling framework",
}) {
  return html`
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <link rel="icon" type="image/png" href="/favicon.png" />
    <link rel="stylesheet" href="/styles/main.css" />

    <script src="https://code.iconify.design/iconify-icon/3.0.0/iconify-icon.min.js"></script>
    <style>
      :root {
        --color-primary: #000;
        --color-on-primary: #fff;
        --color-secondary: #fff;
      }
      ::selection {
        background-color: var(--color-primary);
        color: var(--color-on-primary);
      }
      
      /* Markdown prose styles */
      .prose {
        max-width: none;
      }
      .prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6 {
        margin-top: 0.5em;
        margin-bottom: 0.25em;
        font-weight: 600;
      }
      .prose p {
        margin-top: 0.25em;
        margin-bottom: 0.25em;
      }
      .prose ul, .prose ol {
        margin-top: 0.25em;
        margin-bottom: 0.25em;
        padding-left: 1.25em;
      }
      .prose li {
        margin-top: 0.125em;
        margin-bottom: 0.125em;
      }
      .prose code {
        background-color: rgba(0, 0, 0, 0.1);
        padding: 0.125em 0.25em;
        border-radius: 0.25em;
        font-size: 0.875em;
      }
      /* Inline (single backtick) code – simple styling, no fake backticks */
      .prose :where(code):not(:where(pre code)) {
        background-color: rgba(0, 0, 0, 0.06);
        padding: 0.1em 0.3em;
        border-radius: 0.25em;
        font-size: 0.9em;
      }
      .prose :where(code):not(:where(pre code))::before,
      .prose :where(code):not(:where(pre code))::after {
        content: none !important;
      }
      .prose pre {
        background-color: rgba(0, 0, 0, 0.05);
        padding: 0.5em;
        border-radius: 0.375em;
        overflow-x: auto;
        margin: 0.5em 0;
      }
      .prose pre code {
        background-color: transparent;
        padding: 0;
      }
      .prose blockquote {
        border-left: 4px solid #e5e7eb;
        padding-left: 1em;
        margin: 0.5em 0;
        font-style: italic;
      }
      .prose strong {
        font-weight: 600;
      }
      .prose em {
        font-style: italic;
      }

      /* Code block styles */
      .code-block {
        position: relative;
        margin: 1em 0;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        background: #1e1e1e;
        max-width: 100%;
        width: 100%;
      }

      .code-block pre {
        margin: 0;
        padding: 1rem;
        overflow-x: auto;
        background: #1e1e1e !important;
        border-radius: 8px;
        font-family: 'Fira Code', 'Monaco', 'Cascadia Code', 'Roboto Mono', monospace;
        font-size: 0.875rem;
        line-height: 1.5;
        max-width: 100%;
        box-sizing: border-box;
      }

      .code-block code {
        background: transparent !important;
        padding: 0 !important;
        border-radius: 0 !important;
        color: #d4d4d4;
        display: block;
        white-space: pre;
        overflow-wrap: break-word;
        word-break: break-all;
        max-width: 100%;
      }

      /* Dark theme adjustments for chat messages */
      .dark .code-block {
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2);
      }
      
      @media (prefers-color-scheme: dark) {
        .code-block {
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2);
        }
      }

      /* Copy button positioning */
      .code-block copy-code-button {
        position: absolute;
        top: 8px;
        right: 8px;
        z-index: 10;
      }

      /* Ensure code blocks in chat messages are properly styled */
      .chat-message .code-block {
        max-width: 100%;
      }

      .chat-message .code-block pre {
        max-width: 100%;
        white-space: pre-wrap;
        word-break: break-word;
      }

      /* Ensure inner code respects wrapping inside chat messages */
      .chat-message .code-block code {
        white-space: pre-wrap !important;
        word-break: break-word;
        overflow-wrap: anywhere;
        max-width: 100%;
      }
    </style>
  `;
}