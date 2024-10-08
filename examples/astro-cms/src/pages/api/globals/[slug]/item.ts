import type { APIRoute } from 'astro';
import { treesap } from "@/treesap/treesap.config";


export const POST: APIRoute = async ({ params, request }) => {
  const slug = params.slug;
  
  const item = await request.json();
  await treesap.createGlobalItem(slug, item);
  return new Response(
    JSON.stringify({ success: true })
  )
}

export const GET: APIRoute = async ({ params, request }) => {
  const slug = params.slug;
  const item = await treesap.getGlobalItem(slug); 
  return new Response(
    JSON.stringify(item)
  )
}