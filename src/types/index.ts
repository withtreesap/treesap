export interface TreesapOptions {
  db: Deno.Kv;
  collections: Collection[];
  globals: Global[];
}

export interface Collection {
  name: string;
  slug: string;
  fields: Field[];
}

export interface Field {
  name: string;
  description?: string;
  type: string;
  label: string;
  required?: boolean;
}

export interface Global {
  name: string;
  slug: string;
  fields: Field[];
}

export interface CmsNavData {
  type: "collection" | "global";
  name: string;
  slug: string;
}       