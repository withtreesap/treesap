import type { APIRoute } from 'astro';
import { treesap } from "../../../treesap/treesap.js";

export const GET: APIRoute = async ({ params, request }) => {
  const globals = await treesap.getGlobals();
  console.log(globals);
  return new Response(
    JSON.stringify(globals)
  )
}