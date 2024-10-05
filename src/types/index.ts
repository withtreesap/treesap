export interface TreesapOptions {
  db: Deno.Kv;
  collections: Collection[];
  globals: Global[];
}

export interface Collection {
  slug: string;
  label: string;
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
  slug: string;
  label: string;
  fields: Field[];
}

export interface CmsNavData {
  type: "collection" | "global";
  slug: string;
  label: string;
}       