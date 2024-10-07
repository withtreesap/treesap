import type { Collection } from "@treesap/treesap";

export const posts: Collection = {
  name: "Posts",
  slug: "posts",
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
      type: "markdown",
    },
  ],
};