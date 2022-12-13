import { serve } from "./deps.ts";

export async function start() {
  // TODO add options

  await serve((req) => {
    // TODO add request handling
    return new Response("Hello World");
  });
}