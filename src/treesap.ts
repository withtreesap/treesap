import { Hono } from "@hono/hono";

export interface TreesapOptions {
  app: Hono;
  db: Deno.Kv;
  collections: Collection[];
}

export interface Collection {
  slug: string;
  labels: {
    singular: string;
    plural: string;
  };
}

export interface CmsNavData {
  label: string;
  href: string;
}       

export class Treesap {
  app: Hono;
  db: Deno.Kv;
  collections: Collection[];

  constructor(
    options: TreesapOptions
  ) {
    this.app = options.app;
    this.db = options.db;
    this.collections = options.collections;
    this.registerRoutes();
  }

  parseWhere(where: string) : Record<string, string> {
    const conditions = where.split(';'); // Split multiple conditions
    const query: Record<string, string> = {};
    for (const condition of conditions) {
      const [key, value] = condition.split('='); // Split key=value
      query[key] = value;
    }
    return query;
  }

  registerRoutes() {
    this.app.get("/", (c) => c.redirect("/"));
    this.api();
  }

  api() { 
    this.collections.forEach(collection => {
      this.app.get(`/${collection.slug}`, async (c) => {
        // where is a string of key=value pairs separated by ;
        // ex. name=John;age=30;city=New York
        const where = c.req.query('where');
        const entries = this.db.list({ prefix: [collection.slug] });
        const items = [];

        for await (const entry of entries) {
          let match = true;
          if (where) {
            const query = this.parseWhere(where);
            for (const key in query) {
              
              if ((entry.value as Record<string, string>)[key] !== query[key]) {
                match = false;
                break;
              }
            }
          }
          if (match) {
            items.push(entry.value);
          }
        }
        return c.json(items);
      })

      this.app.post(`/${collection.slug}`, async (c) => {
        const data = await c.req.json()
        const projectKey = [collection.slug, data.id];
        const res = await this.db.atomic()
          // check if the project already exists
          .check({ key: projectKey, versionstamp: null })
          .set(projectKey, data)
          .commit();

        if (!res.ok) {
          throw new Error(`Failed to create ${collection.slug}`);
        }

        return c.json(data)
      })

      this.app.get(`/${collection.slug}/:id`, async (c) => {
        const { id } = c.req.param();
        const itemKey = [collection.slug, id];
        const item = await this.db.get(itemKey);
        return c.json(item)
      })

      this.app.delete(`/${collection.slug}/:id`, async (c) => {
        const { id } = c.req.param();
        const itemKey = [collection.slug, id];
        await this.db.delete(itemKey);
        return c.json({ message: 'Deleted' });
      })

    });
  }

   getCmsNav(): CmsNavData[] {
    const nav: CmsNavData[] = [];
    for (const collection of this.collections) {
      nav.push({
        label: collection.labels.plural,
        href: `/cms/${collection.slug}`,
      })
    }
    return nav;
  }

  getCollection(collection: string): Collection | undefined {
    return this.collections.find(c => c.slug === collection);
  }

  // a find method that can be used to find all items in a collection
  async find({
    collection,
  } : { collection: string }) : Promise<any[]> {
    const entries = this.db.list({ prefix: [collection] });
    const items: any[] = [];

    for await (const entry of entries) {
      items.push(entry.value);
    }

    return items;
  }

  // a findByID method that can be used to find a single item by id
  async findByID({
    collection,
    id,
  }: { collection: string, id: string }) : Promise<any | undefined> {
    const item = await this.db.get([collection, id]);
    return item;
  }
  // a create method that can be used to create data directly in the kv database
  async create({
    collection,
    data,
  }: { collection: string, data: any }) : Promise<any | undefined> {
    const res = await this.db.atomic()
      .set([collection, data.id], data)
      .commit();
    
    return res;
  }
  // an update method that can be used to update data directly in the kv database
  async update({
    collection,
    id,
    data,
  }: { collection: string, id: string, data: any }) : Promise<any | undefined> {
    // get the existing data
    const existing = await this.db.get([collection, id]);
    if (!existing) {
      return undefined;
    }
    // merge the existing data with the new data
    const updated = { ...existing, ...data };
    // update the data in the kv database
    await this.db.set([collection, id], updated);
    return updated;
  }
  // a delete method that can be used to delete data directly from the kv database
  async delete({
    collection,
    id,
  }: { collection: string, id: string }) : Promise<any | undefined> {
    await this.db.delete([collection, id]);
  }
  // a fetch method that can be used to fetch data from the api
  fetch(req: Request ) : Response | Promise<Response> {
    return this.app.fetch(req);
  }
}

