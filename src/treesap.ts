import { Collection, Global, TreesapOptions, CmsNavData } from './types/index.ts';
import {ulid} from '@std/ulid';

export class Treesap {
  db: Deno.Kv;
  collections: Collection[] | null = null;
  globals: Global[] | null = null;
  

  constructor(
    options: TreesapOptions
  ) {
    this.db = options.db;
    this.collections = options.collections;
    this.globals = options.globals;

    // Initialize collections and globals if provided in options
    this.initCollections();
    this.initGlobals();
  }

  async initCollections() {
    // if collections are provided in the options, initialize them
    if (this.collections && this.collections.length > 0) {
      // create all collections
      for (const collection of this.collections) {
        await this.createCollection(collection);
      }
      this.collections = null; // Clear cache to force refresh
    }
  }

  async initGlobals() {
    // if globals are provided in the options, initialize them
    if (this.globals && this.globals.length > 0) {
      // create all globals
      for (const global of this.globals) {
        await this.createGlobal(global);
      }
      this.globals = null; // Clear cache to force refresh
    }
  }

  async getCmsNav(): Promise<CmsNavData[]> {
    // Use cached collections, if available
    const collections = this.collections || await this.getCollections();
    const globals = this.globals || await this.getGlobals();
    const nav: CmsNavData[] = [];
    for (const collection of collections) {
      nav.push({
        type: "collection",
        name: collection.name,
        slug: collection.slug,
      })
    }
    for (const global of globals) {
      nav.push({
        type: "global",
        name: global.name,
        slug: global.slug,
      })
    }
    return nav;
  }

  // Globals

  async getGlobals(): Promise<Global[]> {
    const globals = [];
    const result = this.db.list({ prefix: ["globals"] });
    for await (const item of result) {
      globals.push(item.value as Global);
    }
    return globals;
  }

  async getGlobal(slug: string): Promise<Global | undefined> {
    const result = await this.db.get(["globals", slug]);
    return result.value as Global;
  }

  async createGlobal(global: Global): Promise<any | undefined> {
    const res = await this.db.atomic()
      .set(["globals", global.slug], global)
      .commit();
    if (res.ok) {
      this.globals = null;
    }
    return res;
  }

  async deleteGlobal(slug: string): Promise<any | undefined> {
    await this.db.delete(["globals", slug]);
  }

  // Collections
  async getCollections(): Promise<Collection[]> {
    const collections = [];
    const result = this.db.list({ prefix: ["collections"] });
    for await (const item of result) {
      collections.push(item.value as Collection);
    }

    return collections
  }

  async getCollection(collection: string): Promise<Collection | undefined> {
    // Use cached collections, if available
    const collections = this.collections || await this.getCollections();
    return collections.find(c => c.slug === collection);
  }

  async createCollection(collection: Collection): Promise<any | undefined> {
    const res = await this.db.atomic()
      .set(["collections", collection.slug], collection)
      .commit();
    // clear the cached collections
    if (res.ok) {
      this.collections = null;
    }

    return res;
  }

  async updateCollection(collection: Collection): Promise<any | undefined> {

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

  async deleteCollection(collection: string): Promise<any | undefined> {
    // find the collection
    const collectionItem = await this.getCollection(collection);
    if (!collectionItem) {
      return undefined;
    }
    // delete all the items in the collection
    const items = await this.find({ collection: collectionItem.slug });
    for (const item of items) {
      await this.delete({ collection: collectionItem.slug, id: item.id });
    }
    // delete the collection
    await this.db.delete(["collections", collectionItem.slug]);
    // clear the cached collections
    this.collections = null;

  }

  // a find method that can be used to find all items in a collection
  async find({
    collection,
  }: { collection: string }): Promise<any[]> {
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
  }: { collection: string, id: string }): Promise<any | undefined> {
    const item = await this.db.get([collection, id]);
    return item;
  }
  // a create method that can be used to create data directly in the kv database
  async create({
    collection,
    data,
  }: { collection: string, data: any }): Promise<any | undefined> {
    const id = ulid();
    const newData = {
      id,
      ...data,
    }
    const res = await this.db.atomic()
      .set([collection, id], newData)
      .commit();

    return res;
  }
  // an update method that can be used to update data directly in the kv database
  async update({
    collection,
    id,
    data,
  }: { collection: string, id: string, data: any }): Promise<any | undefined> {
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
  }: { collection: string, id: string }): Promise<any | undefined> {
    await this.db.delete([collection, id]);
  }
}



