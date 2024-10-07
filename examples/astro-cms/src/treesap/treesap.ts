import { Treesap } from "@treesap/treesap";
import { links } from "./collections/links.ts";
import { pages } from "./collections/pages.ts";
import { socials } from "./globals/socials.ts";

export const kv = await Deno.openKv();;

export const treesap = new Treesap({
  db: kv,
  collections: [links, pages],
  globals: [socials],
});
