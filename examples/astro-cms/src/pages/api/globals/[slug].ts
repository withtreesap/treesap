import type { APIRoute } from 'astro';
import { treesap } from "@/utils/treesap.ts";

export const GET: APIRoute = async ({ params, request }) => {
  const slug = params.slug;
  const global = await treesap.getGlobal(slug);
  return new Response(
    JSON.stringify(global)
  )
}
