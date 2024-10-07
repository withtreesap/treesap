import type { Collection } from "@treesap/treesap";

export const work: Collection = {
  name: "Work",
  slug: "work",
  fields: [
    {
      name: "title",
      label: "Title",
      type: "text",
    },
    {
      name: "subtitle",
      label: "Subtitle",
      type: "text",
    },
    {
      name: "url",
      label: "URL",
      type: "text",
    },
    {
      name: "chipText",
      label: "Chip Text",
      type: "text",
    },
  ],
};