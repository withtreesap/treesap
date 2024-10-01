import { Handlers, PageProps } from "$fresh/server.ts";
import { treesap } from '../../utils/treesap.ts'

export const handler: Handlers = {
  async GET(_, ctx) {
    const cmsNavData = await treesap.getCmsNav();
    return ctx.render({ cmsNavData });
  },
};

export default function CollectionPage(props: PageProps) {
  const { cmsNavData } = props.data;

  return (
    <div class="">
      <div class="flex justify-between items-center">
        <h1 class="text-2xl font-bold">Treesap CMS</h1>
      </div>
      <ul class="my-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cmsNavData.map((collection: { label: string, href: string }) => (
          <a href={collection.href} class="text-lg font-medium block"> 
            <li key={collection.label} class="bg-white dark:bg-slate-800 p-4 shadow-md rounded-md">
              {collection.label}
            </li>
          </a>
        ))}
      </ul>
    </div>
  );
}

