import { Hono } from "@hono/hono";

export interface TreesapOptions {
  app: Hono;
  db: Deno.Kv;
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

  private collections: Collection[] | null = null;

  constructor(
    options: TreesapOptions
  ) {
    this.app = options.app;
    this.db = options.db;
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

  async registerRoutes() {
    this.collections = await this.getCollections(); 
    this.app.get("/", async (c) => {
        // Use cached collections, if available
        const collections = this.collections || await this.getCollections();
        return c.json(collections);
    });
    this.api();
  }

  async getCollections(): Promise<Collection[]> {
    const collections = [];
    const result = this.db.list({ prefix: ["collections"] });
    for await (const item of result) {
        collections.push(item.value as Collection);
    }

    return collections
  }

  async api() { 
    // Use cached collections
    const collections = this.collections!;

    collections.forEach(collection => {
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

  async getCmsNav(): Promise<CmsNavData[]> {
    // Use cached collections, if available
    const collections = this.collections || await this.getCollections();
    const nav: CmsNavData[] = [];
    for (const collection of collections) {
      nav.push({
        label: collection.labels.plural,
        href: `/cms/${collection.slug}`,
      })
    }
    return nav;
  }

  async getCollection(collection: string): Promise<Collection | undefined> {
    // Use cached collections, if available
    const collections = this.collections || await this.getCollections();
    return collections.find(c => c.slug === collection);
  }

  async createCollection(collection: Collection) : Promise<any | undefined> {
    const res = await this.db.atomic()
      .set(["collections", collection.slug], collection)
      .commit();
    // clear the cached collections
    if (res.ok) {
      this.collections = null; 
    }

    return res;
  } 

  async updateCollection(collection: Collection) : Promise<any | undefined> {

    // get the existing collection
    const existing = await this.db.get(["collections", collection.slug]);
    if (!existing) {
      return undefined;
    }

    // find all the items in the collection
    const items = await this.db.list({ prefix: [collection.slug] });
    for await (const item of items) {
      // merge the existing collection with the new collection
      const updated = { ...existing, ...collection };
      // update the item
      await this.db.set([collection.slug, item.key[1]], updated);
    }

    // merge the existing collection with the new collection
    const updated = { ...existing, ...collection };
    
    const res = await this.db.atomic()
      .set(["collections", collection.slug], updated)
      .commit();

    // clear the cached collections
    if (res.ok) {
      this.collections = null; 
    }
    return res;
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

