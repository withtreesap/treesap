import type { Collection } from "@treesap/treesap";

export const links: Collection = {
  name: "Links",
  slug: "links",
  fields: [
    {
      name: "title",
      label: "Title",
      type: "text",
    },
    {
      name: "url",
      label: "URL",
      type: "text",
    },
  ],
};