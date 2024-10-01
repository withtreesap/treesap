import { Handlers, PageProps } from "$fresh/server.ts";
import { treesap } from "../../../../utils/treesap.ts";
import { redirect } from "../../../../utils/http.ts";
import DeleteItemButton from "../../../../islands/DeleteItemButton.tsx";

export const handler: Handlers = {
  async POST(req, ctx) {
    const form = await req.formData();
    const { collection, id } = ctx.params;

    const title = form.get("title") as string;
    const description = form.get("description") as string;
    const url = form.get("url") as string;
    const chipText = form.get("chipText") as string | null;

    if (!title || !description || !url) {
      return Response.json({ error: "Missing required fields" }, {
        status: 400,
      });
    }

    await treesap.update({
      collection: collection,
      id: id,
      data: {
        id,
        title,
        description,
        url,
        chipText,
      },
    });
    return redirect(`/cms/collections/${collection}/${id}`);

  },

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
  const { collection, id } = props.params;

  return (
    <div>
      <form
        method="POST"
        class=""
      >
        <div class="flex justify-end mb-4 gap-4">
          <DeleteItemButton collection={collection} id={id} />
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
