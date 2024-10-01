import { Handlers } from "$fresh/server.ts";
import { treesap } from '../../../utils/treesap.ts'
import { redirect } from "../../../utils/http.ts";

export const handler: Handlers<{ collection: string }> = {
  async POST(req, ctx) {
    const form = await req.formData();

    const slug = form.get("slug") as string;  
    const singular = form.get("singular") as string;
    const plural = form.get("plural") as string;

    if (!slug || !singular || !plural) { 
      return Response.json({ error: "Missing required fields" }, {
        status: 400,
      });
    }
    const labels = {
      singular,
      plural,
    }

    await treesap.createCollection({
      slug,
      labels,
    });

    return redirect(`/admin/collections/${slug}`);
  },

};

export default function Projects() {
  return (
    <div>
      <form
        method="POST"
        class=""
      >
        <div class="flex justify-between items-center mb-4">
          <h1 class="text-2xl font-bold">Create Collection</h1>
          <button
            type="submit"
            class="bg-blue-500 hover:bg-blue-800 text-white font-bold py-2 px-4 rounded"
          >
            Save
          </button>
        </div>
        <div class="flex flex-col gap-4">

          <input
            name="slug"
            type="text"
            placeholder="Collection Slug"
            required
            class="border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input      
            name="singular"
            type="text"
            placeholder="Singular"
            required
            class="border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            name="plural"
            type="text"
            placeholder="Plural"
            class="border dark:border-slate-700 dark:bg-slate-800 dark:text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </form>
        
    </div>
  );
}
