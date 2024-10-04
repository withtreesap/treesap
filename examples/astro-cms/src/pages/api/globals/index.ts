import type { APIRoute } from 'astro';
import { treesap } from "../../../utils/treesap.ts";

export const GET: APIRoute = async ({ params, request }) => {
  const globals = await treesap.getGlobals();
  console.log(globals);
  return new Response(
    JSON.stringify(globals)
  )
}