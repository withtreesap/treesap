import type { APIRoute } from 'astro';
import { treesap } from "@/treesap/treesap";


const collection = {
  slug: "pages",
  label: "Pages",
}

await treesap.createCollection(collection);

export const DELETE: APIRoute = async ({ params, request }) => {
  const slug = params.slug;
  await treesap.deleteCollection(slug);
  return new Response(
    JSON.stringify({ success: true })
  )
}

export const GET: APIRoute = async ({ params, request }) => {
  const slug = params.slug;
  const collection = await treesap.getCollection(slug);
  return new Response(
    JSON.stringify(collection)
  )
}
