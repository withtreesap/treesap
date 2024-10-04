import type { APIRoute } from 'astro';
import { treesap } from "@/utils/treesap.ts";

export const POST: APIRoute = async ({ params, request }) => {
  const collection = await request.json();
  
  await treesap.createCollection(collection);
  return new Response(
    JSON.stringify(collection)
  )
}

export const GET: APIRoute = async ({ params, request }) => {
  const collections = await treesap.getCollections();
  console.log(collections);
  return new Response(
    JSON.stringify(collections)
  )
}