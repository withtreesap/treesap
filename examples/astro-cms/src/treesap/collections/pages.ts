import type { Collection } from "@treesap/treesap";

export const pages: Collection = {
  name: "Pages",
  slug: "pages",
  fields: [
    {
      name: "slug",
      label: "Slug",
      type: "slug",
    },
    {
      name: "title",
      label: "Title",
      type: "text",
    },
    {
      name: "content",
      label: "Content",
      type: "textarea",
    },
  ],
};