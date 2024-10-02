import { Handlers, PageProps } from "$fresh/server.ts";
import { treesap } from '../../../../utils/treesap.ts'
import { redirect } from "../../../../utils/http.ts";
import DeleteCollectionForm from "../../../../islands/treesap/DeleteCollectionForm.tsx";

export const handler: Handlers = {
   async GET(req, ctx) {       
    const { collection } = ctx.params;
    const collectionData = await treesap.getCollection(collection);
    
    return ctx.render({ collectionData });
  }
};

export default function Projects(props: PageProps) {
  const { collectionData } = props.data;

  return (
    <div class="flex flex-col items-center justify-center h-screen gap-4">
      <h1 class="text-4xl font-bold text-center">⚠️ Delete Collection ⚠️</h1>
      <p class="text-2xl text-center">Are you sure you want to delete the collection?</p>
      <DeleteCollectionForm collection={collectionData.slug} />
    </div>
  );
}
