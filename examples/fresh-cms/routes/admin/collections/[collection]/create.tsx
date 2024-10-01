import { Handlers } from "$fresh/server.ts";
import { ulid } from "@std/ulid/ulid";
import { treesap } from '../../../../utils/treesap.ts'
import { redirect } from "../../../../utils/http.ts";

export const handler: Handlers<{ collection: string }> = {
  async POST(req, ctx) {
    const form = await req.formData();
    const { collection } = ctx.params;

    const title = form.get("title") as string;
    const description = form.get("description") as string;
    const url = form.get("url") as string;
    const chipText = form.get("chipText") as string | null;

    if (!title || !description || !url) { 
      return Response.json({ error: "Missing required fields" }, {
        status: 400,
      });
    }

    const id = ulid();

    await treesap.create({
      collection: collection,
      data: {
        id,
        title,
        description,
        url,
        chipText,
      },
    });

    return redirect(`/cms/${collection}/${id}`);
  },

};

export default function Projects() {
  return (
    <div>
      <form
        method="POST"
        class=""
      >
        <div class="flex justify-end mb-4">
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
            class="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <textarea
            name="description"
            placeholder="Description"
            required
            class="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            name="url"
            type="text"
            placeholder="URL"
            required
            class="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            name="chipText"
            type="text"
            placeholder="Chip Text"
            class="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </form>
        
    </div>
  );
}
