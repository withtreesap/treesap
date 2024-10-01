import { defineLayout, RouteConfig } from "$fresh/server.ts";
import { CmsNavData } from "@treesap/treesap";
import { treesap } from "../../utils/treesap.ts";

export const config: RouteConfig = {
  skipAppWrapper: true, // Skip the app wrapper during rendering
};

export default defineLayout(async (req, ctx) => {
  const navData = await treesap.getCmsNav();
  const currentPath = ctx.url.pathname;
  const isActive = (href: string) => href === currentPath;

  const collections: CmsNavData[] = []
  const globals: CmsNavData[] = []

  navData.forEach((nav) => {
    if (nav.type === "collection") {
      collections.push(nav);
    } else if (nav.type === "global") {
      globals.push(nav);
    }
  });

  return (
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width" />
        <link rel="icon" type="image/png" href="/favicon.png" />
        {/* noindex */}
        <meta name="robots" content="noindex" />
        <title>Treesap CMS</title>
        <meta name="title" content="Treesap CMS" />
        <link rel="stylesheet" href="/styles.css" />
        <script src="/wc/wc.esm.js" type="module"></script>
      </head>
      <body class="bg-background dark:bg-slate-950 text-onbg dark:text-white prose-primary-950 dark:prose-primary-50 flex h-screen ">
        <aside class="w-64 border-r p-4">
          <a class="flex items-center gap-2 text-sm rounded-lg p-2" href="/">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            <span>Back to Site</span>
          </a>
          <a class="inline-flex items-center justify-center w-8 h-8" href="/cms">
            <span class="text-2xl">🌲</span>
          </a>
          <div class="flex justify-between items-center mb-2">
            <h2 class="text-sm font-bold">Collections</h2>
            <a href="/admin/collections/create" class="text-sm text-primary-500 flex items-center gap-2 hover:bg-gray-100 rounded-md p-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </a>
          </div>
          <ul>
            {collections.map((nav) => (
              <li key={nav.label}>
                <a href={nav.href} class={`flex items-center gap-2 text-sm rounded-lg p-2 hover:bg-gray-100 ${isActive(nav.href) ? "bg-gray-200" : ""}`}>
                  <span class="flex items-center justify-center w-4 h-4"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12"><path d="M 5.833 0 C 8.595 0 10.833 1.119 10.833 2.5 C 10.833 3.881 8.595 5 5.833 5 C 3.072 5 0.833 3.881 0.833 2.5 C 0.833 1.119 3.072 0 5.833 0 Z M 10.833 6 C 10.833 7.381 8.595 8.5 5.833 8.5 C 3.072 8.5 0.833 7.381 0.833 6 C 0.833 5.31 0.833 4 0.833 4 C 0.833 5.381 3.072 6.5 5.833 6.5 C 8.595 6.5 10.833 5.381 10.833 4 C 10.833 4 10.833 5.31 10.833 6 Z M 10.833 9.5 C 10.833 10.881 8.595 12 5.833 12 C 3.072 12 0.833 10.881 0.833 9.5 C 0.833 8.81 0.833 7.5 0.833 7.5 C 0.833 8.881 3.072 10 5.833 10 C 8.595 10 10.833 8.881 10.833 7.5 C 10.833 7.5 10.833 8.81 10.833 9.5 Z" fill="currentColor"></path></svg></span>
                  {nav.label}
                </a>
              </li>
            ))}
          </ul>
          <div class="flex justify-between items-center mb-2">
            <h2 class="text-sm font-bold">Globals</h2>
            <a href="/admin/globals/create" class="text-sm text-primary-500 flex items-center gap-2 hover:bg-gray-100 rounded-md p-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
            </a>
          </div>
          <ul>
            {globals.map((nav) => (
              <li key={nav.label}>
                <a href={nav.href} class={`flex items-center gap-2 text-sm rounded-lg p-2 hover:bg-gray-100 ${isActive(nav.href) ? "bg-gray-200" : ""}`}>
                  {nav.label}
                </a>
              </li>
            ))}
          </ul>
        </aside>
        <main class="flex-1 p-4">
          <ctx.Component />
        </main>
      </body>

    </html>

  );
});
