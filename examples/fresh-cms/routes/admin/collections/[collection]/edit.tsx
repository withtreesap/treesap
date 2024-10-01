import { Handlers, PageProps } from "$fresh/server.ts";
import { treesap } from '../../../../utils/treesap.ts'

export const handler: Handlers = {
  // async POST(req, ctx) {
  //   const form = await req.formData();
  //   const { slug } = ctx.params;

  //   const newSlug = form.get("slug") as string;
  //   const singular = form.get("singular") as string;
  //   const plural = form.get("plural") as string;

  //   if (!slug || !singular || !plural) {
  //     return Response.json({ error: "Missing required fields" }, {
  //       status: 400,
  //     });
  //   }

  //   await treesap.updateCollection({
  //     slug,
  //     singular,
  //     plural,
  //   });
  
  //   return redirect(`/admin/collections/${collection}`);

  // },

  async GET(req, ctx) {       
    const { collection } = ctx.params;
    const collectionData = await treesap.getCollection(collection);
    
    return ctx.render({ collectionData });
  }
};

export default function Projects(props: PageProps) {
  const { collectionData } = props.data;

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
                name="slug"
                type="text"
                placeholder="Collection Slug"
                required
                value={collectionData.slug}
                class="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <textarea
                name="singular"
                placeholder="Singular"
                required
                value={collectionData.labels.singular}
                class="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                name="url"
                type="text"
                placeholder="Plural"
                required
                value={collectionData.labels.plural}
                class="border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
         
        </div>

      </form>
    </div>
  );
}
