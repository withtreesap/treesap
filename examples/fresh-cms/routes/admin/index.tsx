import { Handlers, PageProps } from "$fresh/server.ts";
import { treesap } from '../../utils/treesap.ts'
import { CmsNavData } from '@treesap/treesap'
export const handler: Handlers = {
  async GET(_, ctx) {
    const cmsNavData = await treesap.getCmsNav();
    return ctx.render({ cmsNavData });
  },
};

export default function CollectionPage(props: PageProps) {
  const { cmsNavData } = props.data;
  const collections = cmsNavData.filter((item: CmsNavData) => item.type === "collection");
  const globals = cmsNavData.filter((item: CmsNavData) => item.type === "global");
  return (
    <div class="">
      <div class="flex justify-between items-center mb-8">
        <h1 class="text-2xl font-bold">Treesap CMS</h1>
      </div>
      <h2 class="text-lg font-medium">Collections</h2>
      <ul class="my-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {collections.map((collection: { label: string, slug: string }) => (
          <a href={`/admin/collections/${collection.slug}`} class="text-lg font-medium block"> 
            <li key={collection.label} class="bg-white dark:bg-slate-800 p-4 shadow-md rounded-md">
              {collection.label}
            </li>
          </a>
        ))}
      </ul>
      <h2 class="text-lg font-medium">Globals</h2>
      <ul class="my-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {globals.map((global: { label: string, slug: string }) => (
          <a href={`/admin/globals/${global.slug}`} class="text-lg font-medium block"> 
            <li key={global.label} class="bg-white dark:bg-slate-800 p-4 shadow-md rounded-md">
              {global.label}
            </li>
          </a>
        ))}
      </ul>
    </div>
  );
}

