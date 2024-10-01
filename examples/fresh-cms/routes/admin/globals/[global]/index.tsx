import { Handlers, PageProps } from "$fresh/server.ts";
import { treesap } from "../../../../utils/treesap.ts";
import { redirect } from "../../../../utils/http.ts";
import DeleteItemButton from "../../../../islands/DeleteItemButton.tsx";

export const handler: Handlers = {
  // async POST(req, ctx) {
  //   const form = await req.formData();
  //   const { global, id } = ctx.params;

  //   const title = form.get("title") as string;
  //   const description = form.get("description") as string;
  //   const url = form.get("url") as string;
  //   const chipText = form.get("chipText") as string | null;

  //   if (!title || !description || !url) {
  //     return Response.json({ error: "Missing required fields" }, {
  //       status: 400,
  //     });
  //   }


  //   return redirect(`/cms/${collection}/${id}`);

  // },

  async GET(req, ctx) {
    const { global, id } = ctx.params;
    const item = await treesap.getGlobal(global);
    return ctx.render({ itemData: item });
  }
};

export default function Projects(props: PageProps) {
  const { itemData } = props.data;
  const { global } = props.params;

  return (
    <div>
      <form
        method="POST"
        class=""
      >
        <div class="flex justify-between mb-4 gap-4">
          <div class="flex gap-4">
            <h1 class="text-2xl font-bold">{itemData.label}</h1>
            <a href={`/cms/globals/${global}/edit`} class="font-bold py-2 px-4 rounded outline outline-2 outline-offset-2">Edit</a>
          </div>
          <div class="flex gap-4">
            
            <button
              type="submit"
              class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Save
            </button>
          </div>
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
