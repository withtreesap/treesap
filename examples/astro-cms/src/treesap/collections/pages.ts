import type { Collection } from "@treesap/treesap";

export const pages: Collection = {
  name: "Pages",
  slug: "pages",
  fields: [
    {
      name: "title",
      label: "Title",
      type: "text",
    },
    {
      name: "slug",
      label: "Slug",
      type: "text",
    },
  ],
};