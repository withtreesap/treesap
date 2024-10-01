import { treesap } from "../../../../utils/treesap.ts";
import type { Handlers, PageProps } from "$fresh/server.ts";


export const handler: Handlers = {
  async GET(_, ctx) {
    const { collection } = ctx.params;
    const data = await treesap.find({ collection });
    const collectionData = await treesap.getCollection(collection);
    return ctx.render({ data, collectionData });
  }
}

// deno-lint-ignore no-explicit-any
export default function CollectionPage(props: PageProps<{ data: any, collectionData: any }>) {
  const { collection } = props.params;
  const { data, collectionData } = props.data;
  return (
    <div class="">
      <div class="flex justify-between items-center">
        <h1 class="text-2xl font-bold">{collectionData.labels.plural}</h1>
        <a href={`/admin/collections/${collection}/create`} class="bg-blue-500 text-white px-4 py-2 rounded-md">Create</a>
      </div>
      <ul class="my-4 flex flex-col gap-4">
        {data &&
          data.map((item: { id: string, title: string }) => (
            <li class="border rounded-md p-2 px-4 flex justify-between items-center">
              <div>
                <a href={`/admin/collections/${collection}/${item.id}`}>
                  <h2 class="text-md font-bold">{item.title}</h2>
                </a>
              </div>
            </li>
          ))}
      </ul>
    </div>
  );
}

