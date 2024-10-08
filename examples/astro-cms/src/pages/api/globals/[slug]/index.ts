import type { APIRoute } from 'astro';
import { treesap } from "@/treesap/treesap.config";


export const DELETE: APIRoute = async ({ params, request }) => {
  const slug = params.slug;
  await treesap.deleteGlobal(slug);
  return new Response(
    JSON.stringify({ success: true })
  )
}

export const GET: APIRoute = async ({ params, request }) => {
  const slug = params.slug;
  const global = await treesap.getGlobal(slug);
  return new Response(
    JSON.stringify(global)
  )
}
