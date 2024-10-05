import { Treesap } from "@treesap/treesap";

export const kv = await Deno.openKv();;

export const treesap = new Treesap({
  db: kv,
});