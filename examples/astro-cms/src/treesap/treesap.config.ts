import { Treesap } from "@treesap/treesap";
import { links } from "./collections/links.ts";
import { projects } from "./collections/projects.ts";
import { socials } from "./globals/socials.ts";
import { posts } from "./collections/posts.ts";

export const kv = await Deno.openKv();;

export const treesap = new Treesap({
  db: kv,
  collections: [links, projects, posts],
  globals: [socials],
});


export const getKV = async () => {
  return await Array.fromAsync(kv.list({ prefix: [] }));
};

