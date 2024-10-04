import type { APIRoute } from 'astro';
import { treesap } from "@/utils/treesap.ts";


const collection = {
  slug: "pages",
  label: "Pages",
}

await treesap.createCollection(collection);

export const GET: APIRoute = async ({ params, request }) => {
  const slug = params.slug;
  const collection = await treesap.getCollection(slug);
  return new Response(
    JSON.stringify(collection)
  )
}
