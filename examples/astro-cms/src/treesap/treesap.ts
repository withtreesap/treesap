import { Treesap } from "@treesap/treesap";
import { links } from "./collections/links.ts";
import { pages } from "./collections/pages.ts";
import { projects } from "./collections/projects.ts";
import { socials } from "./globals/socials.ts";

export const kv = await Deno.openKv();;

export const treesap = new Treesap({
  db: kv,
  collections: [links, pages, projects],
  globals: [socials],
});


export const getKV = async () => {
  return await Array.fromAsync(kv.list({ prefix: [] }));
};

