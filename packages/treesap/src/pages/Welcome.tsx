import Layout from "../layouts/Layout.js";

export function Welcome() {
  return (
    <Layout title="Welcome to Treesap">
      <div class="h-screen flex flex-col items-center justify-center bg-gray-50 p-8">
        <div class="text-center max-w-2xl">
          <h1 class="text-6xl font-bold text-gray-800 mb-4">🌳</h1>
          <h2 class="text-4xl font-bold text-gray-800 mb-6">Welcome to Treesap</h2>
          <p class="text-xl text-gray-600 mb-8">
            Your integrated development environment with terminal and live preview.
          </p>
          
          <div class="space-y-4">
            <a 
              href="/code" 
              class="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow-lg border-2 border-green-600"
              style="background-color: #16a34a !important; color: white !important; text-decoration: none !important;"
            >
              Start Coding →
            </a>
            
            <div class="text-gray-500 text-sm">
              or navigate to <code class="bg-gray-200 px-2 py-1 rounded">/code</code> to begin
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}