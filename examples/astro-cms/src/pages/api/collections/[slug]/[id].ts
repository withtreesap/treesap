import type { APIRoute } from 'astro';
import { treesap } from "@/treesap/treesap";


export const PUT: APIRoute = async ({ params, request }) => {
  const slug = params.slug;
  const id = params.id;
  const data = await request.json();

  console.log('data', data);

  const res = await treesap.update({
    collection: slug,
    id,
    data,
  }); 

  return new Response(
    JSON.stringify({ success: true })
  )
}

export const DELETE: APIRoute = async ({ params, request }) => {
  const slug = params.slug;
  const id = params.id;

  const res = await treesap.delete({
    collection: slug,
    id,
  });

  return new Response(
    JSON.stringify({ success: true })
  )
}