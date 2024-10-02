import { Handlers, PageProps } from "$fresh/server.ts";
import { treesap } from "../../../../utils/treesap.ts";

export const handler: Handlers = {
  async GET(req, ctx) {
    const { collection, id } = ctx.params;
    const item = await treesap.findByID({
      collection: collection,
      id: id,
    });
    const itemData = item.value;
    return ctx.render({ itemData });
  }
};

export default function Projects(props: PageProps) {
  const { itemData } = props.data;

  return (
    <div>
      <form
        method="POST"
        class=""
      >
        <div class="flex justify-end mb-4 gap-4">
          
          <button
            type="submit"
            class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Save
          </button>
        </div>
        <div class="flex flex-col gap-4">
          <input
            name="title"
            type="text"
            placeholder="Project Name"
            required
            value={itemData.title}
            class="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <textarea
            name="description"
            placeholder="Description"
            required
            value={itemData.description}
            class="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            name="url"
            type="text"
            placeholder="URL"
            required
            value={itemData.url}
            class="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            name="chipText"
            type="text"
            placeholder="Chip Text"
            value={itemData.chipText}
            class="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

      </form>
    </div>
  );
}
