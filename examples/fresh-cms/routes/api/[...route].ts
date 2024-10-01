import { type Handler } from "$fresh/server.ts";
import { treesap } from "../../utils/treesap.ts";

export const handler: Handler = (req) => treesap.fetch(req);
// export type AppType = typeof route;
