import { Handlers } from "$fresh/server.ts";
import { treesap } from '../../../utils/treesap.ts'
import { redirect } from "../../../utils/http.ts";

export const handler: Handlers<{ collection: string }> = {
  async POST(req, ctx) {
    const form = await req.formData();

    const slug = form.get("slug") as string;  
    const label = form.get("label") as string;

    if (!slug || !label) { 
      return Response.json({ error: "Missing required fields" }, {
        status: 400,
      });
    }
   
    await treesap.createGlobal({
      slug,
      label,
    });

    return redirect(`/admin/globals/${slug}`);
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
          <h1 class="text-2xl font-bold">Create Global</h1>
          <button
            type="submit"
            class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Save
          </button>
        </div>
        <div class="flex flex-col gap-4">

          <input
            name="slug"
            type="text"
            placeholder="Global Slug"
            required
            class="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            name="label"
            type="text"
            placeholder="Label"
            required
            class="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
       
        </div>
      </form>
        
    </div>
  );
}
