import Layout from "../layouts/Layout.js";

export function Welcome() {
  return (
    <Layout title="Welcome to Treesap">
      <div class="h-screen flex flex-col items-center justify-center bg-[#1e1e1e] text-white p-8">
        {/* Header with logo and title */}
        <div class="text-center mb-12">
          <div class="flex items-center justify-center mb-4">
            <div class="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-lg flex items-center justify-center mr-4">
              <span class="text-2xl">🌳</span>
            </div>
            <div class="text-left">
              <h1 class="text-3xl font-semibold text-white">Treesap</h1>
              <p class="text-gray-400 text-sm">Free • Development Environment</p>
            </div>
          </div>
        </div>

        {/* Main action buttons */}
        <div class="flex gap-8 mb-16">
          <a 
            href="/code"
            class="flex flex-col items-center p-6 bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded-lg transition-colors group min-w-[140px]"
          >
            <div class="w-8 h-8 mb-3 text-gray-300 group-hover:text-white transition-colors">
              <iconify-icon icon="tabler:folder-open" width="32" height="32"></iconify-icon>
            </div>
            <span class="text-gray-300 group-hover:text-white transition-colors">Open project</span>
          </a>

          <button 
            class="flex flex-col items-center p-6 bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded-lg transition-colors group min-w-[140px] opacity-50 cursor-not-allowed"
            disabled
          >
            <div class="w-8 h-8 mb-3 text-gray-500">
              <iconify-icon icon="tabler:git-branch" width="32" height="32"></iconify-icon>
            </div>
            <span class="text-gray-500">Clone repo</span>
          </button>

          <button 
            class="flex flex-col items-center p-6 bg-[#2a2a2a] hover:bg-[#3a3a3a] rounded-lg transition-colors group min-w-[140px] opacity-50 cursor-not-allowed"
            disabled
          >
            <div class="w-8 h-8 mb-3 text-gray-500">
              <iconify-icon icon="tabler:terminal" width="32" height="32"></iconify-icon>
            </div>
            <span class="text-gray-500">Connect via SSH</span>
          </button>
        </div>

      </div>
    </Layout>
  );
}