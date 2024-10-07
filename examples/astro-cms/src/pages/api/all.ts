import type { APIRoute } from 'astro';
import { getKV } from "@/treesap/treesap.config";

export const GET: APIRoute = async () => {
  const all = await getKV();
  return new Response(JSON.stringify(all), {
    headers: {
      "Content-Type": "application/json",
    },
  });
};
