import type { CollectionModel, GlobalModel, GlobalItem, TreesapOptions, CmsNavData, DbAdapter, } from './types/index.ts';

export class Treesap {
  firebaseApp: any;
  db: DbAdapter;
  collectionModels: CollectionModel[] | null = null;
  globalModels: GlobalModel[] | null = null;


  constructor(
    options: TreesapOptions
  ) {
    this.firebaseApp = options.firebaseApp;
    this.db = options.db;
    this.collectionModels = options.collectionModels;
    this.globalModels = options.globalModels;

    // Initialize collections and globals provided in options
    this.initCollectionModels();
    this.initGlobalModels();
  }



  async initCollectionModels() {
    // if collections are provided in the options, initialize them
    if (this.collectionModels && this.collectionModels.length > 0) {
      // 1. Get existing collections from the database
      const existingCollections = await this.getCollectionModels();

      // 2. Identify collections to delete
      let collectionsToDelete: CollectionModel[] = [];
      for (const existing of existingCollections) {
        if (!this.collectionModels!.some(provided => provided.slug === existing.slug)) {
          collectionsToDelete.push(existing);
        }
      }

      // 3. Delete removed collections
      for (const collection of collectionsToDelete) {
        await this.deleteCollectionModel(collection.slug);
      }

      // 4. Create new collections (unchanged logic)
      for (const collection of this.collectionModels) {
        await this.createCollectionModel(collection);
      }

      this.collectionModels = null; // Clear cache to force refresh
    }
  }

  async initGlobalModels() {
    // if globals are provided in the options, initialize them
    if (this.globalModels && this.globalModels.length > 0) {
      // create all globals
      // 1. Get existing globals from the database
      const existingGlobals = await this.getGlobalModels();

      // 2. Identify globals to delete
      let globalsToDelete: GlobalModel[] = [];
      for (const existing of existingGlobals) {
        if (!this.globalModels!.some(provided => provided.slug === existing.slug)) {
          globalsToDelete.push(existing);
        }
      }

      // 3. Delete removed globals
      for (const global of globalsToDelete) {
        await this.deleteGlobalModel(global.slug);
      }

      // 4. Create new globals
      for (const global of this.globalModels) {
        await this.createGlobalModel(global);
      }

      this.globalModels = null; // Clear cache to force refresh
    }
  }

  async getCmsNav(): Promise<CmsNavData[]> {
    // Use cached collections, if available
    const collections = this.collectionModels || await this.getCollectionModels();
    const globals = this.globalModels || await this.getGlobalModels();
    const nav: CmsNavData[] = [];

    // Sort collections and globals based on a criteria (e.g., creation date, name, etc.)
    const sortedCollections = collections.sort((a, b) => a.name.localeCompare(b.name)); // Example: sorting by name
    const sortedGlobals = globals.sort((a, b) => a.name.localeCompare(b.name));     // Example: sorting by name

    for (const collection of sortedCollections) {
      nav.push({
        type: "collection",
        name: collection.name,
        slug: collection.slug,
      })
    }
    for (const global of sortedGlobals) {
      nav.push({
        type: "global",
        name: global.name,
        slug: global.slug,
      })
    }
    return nav;
  }

  // Global Models

  async getGlobalModels(): Promise<GlobalModel[]> {
    return await this.db.getGlobalModels();
  }

  async getGlobalModel(slug: string): Promise<GlobalModel | undefined> {
    return await this.db.getGlobalModel(slug);
  }

  async createGlobalModel(globalModel: GlobalModel) {
    await this.db.createGlobalModel(globalModel);
  }

  async deleteGlobalModel(slug: string) {
    await this.db.deleteGlobalModel(slug);
  }

  // Global Items

  async getGlobalItem(slug: string): Promise<GlobalItem | undefined> {
    return await this.db.getGlobalItemBySlug(slug);
  }

  async createGlobalItem({
    slug,
    globalItem,
  }: {
    slug: string,
    globalItem: GlobalItem,
  }): Promise<any | undefined> {
    return await this.db.createGlobalItem(slug, globalItem);
  }

  async updateGlobalItem({
    slug,
    globalItem,
  }: {
    slug: string,
    globalItem: GlobalItem,
  }): Promise<any | undefined> {
    return await this.db.updateGlobalItem(slug, globalItem);
  }

  // Collection Models
  async getCollectionModels(): Promise<CollectionModel[]> {
    return await this.db.getCollectionModels();
  }

  async getCollectionModel(collection: string): Promise<CollectionModel | undefined> {
    return await this.db.getCollectionModel(collection);
  }

  async createCollectionModel(collectionModel: CollectionModel) {
    await this.db.createCollectionModel(collectionModel);
  }

  async deleteCollectionModel(collection: string) {
    await this.db.deleteCollectionModel(collection);
  }


  // Collection Items

  /**
   * Find all items in a collection
   * @param collection - The collection to find the items in
   * @param depth - The depth of the references to populate
   * @returns The items, or an empty array if the collection is not found
   */
  async find<T>({
    collection
  }: { collection: string }): Promise<T[]> {

    const items = await this.db.getCollectionItems(collection);
    return items as T[];

    // const entries = this.db.list({ prefix: [collection] });
    // const items: any[] = [];
    // // if the collection is not found, return an empty array
    // if (!this.collectionModels || !this.collectionModels.find(c => c.slug === collection)) {
    //   return [];
    // }
    // for await (const entry of entries) {
    //   const item = entry.value;
    //   if (depth > 0) {
    //     await this.populateReferences(item, depth - 1);
    //   }
    //   items.push(item);
    // }

    // return items;
  }

  //   /**
  //    * Populate references in an item
  //    * @param item - The item to populate references in
  //    * @param depth - The depth of the references to populate
  //    */
  //   private async populateReferences(item: any, depth: number): Promise<void> {
  //     // if the item is not an object, return
  //     if (!item || typeof item !== 'object') return;
  //     // if the item is an array, populate the references in each item in the array
  //     for (const key of Object.keys(item)) {
  //       const field = this.getFieldDefinition(item, key);
  //       if (field && field.type === 'reference' && item[key]) {
  //         const referencedCollection = field.collection;
  //         if (!referencedCollection) {
  //           continue;
  //         }
  //         const referencedId = item[key];
  //         const referencedItem = await this.findByID({
  //           collection: referencedCollection,
  //           id: referencedId,
  //         });
  //         if (referencedItem) {
  //           item[key] = referencedItem;
  //           if (depth > 0) {
  //             await this.populateReferences(item[key], depth - 1);
  //           }
  //         }
  //       }
  //     }
  //   }

  //   /**
  //    * Get the field definition for a given item and key
  //    * @param item - The item to get the field definition for
  //    * @param key - The key to get the field definition for
  //    * @returns The field definition, or undefined if the field is not found
  //    */
  //   private getFieldDefinition(item: any, key: string): Field | undefined {
  //     // Assuming each item has a _collection property indicating its collection
  //     const collection = item._collection;
  //     const collectionDef = this.collections?.find(c => c.slug === collection);
  //     return collectionDef?.fields.find(f => f.name === key);
  //   }

  /**
   * Find a single item by id
   * @param collection - The collection to find the item in
   * @param id - The id of the item to find
   * @param depth - The depth of the references to populate
   * @returns The item, or undefined if the item is not found
   */
  async findOne<T>({
    collection,
    id,
  }: { collection: string; id: string; }): Promise<T | undefined> {
    const item = await this.db.getCollectionItemById(collection, id)
    // if (item && depth > 0) {
    //   await this.populateReferences(item.value, depth - 1);
    //   return item.value;
    // }
    return item ? item as T : undefined;
  }

  /**
   * Create a new item in a collection
   * @param collection - The collection to create the item in
   * @param data - The data to create the item with
   * @returns The item, or undefined if the item is not created
   */
  async create<T>({
    collection,
    data,
  }: { collection: string, data: T }): Promise<T | undefined> {
    await this.db.createCollectionItem(collection, data)
    return data;
  }

  /**
   * Update an item in a collection
   * @param collection - The collection to update the item in
   * @param id - The id of the item to update
   * @param data - The data to update the item with
   * @returns The item, or undefined if the item is not updated
   */
  async update<T>({
    collection,
    id,
    data,
  }: { collection: string, id: string, data: T }): Promise<T | undefined> {
    await this.db.updateCollectionItem(collection, id, data);
    return data;
  }

  // a delete method that can be used to delete data directly from the kv database
  async delete({
    collection,
    id,
  }: { collection: string, id: string }): Promise<void> {
    await this.db.deleteCollectionItem(collection, id);
  }

}

