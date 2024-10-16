export interface TreesapOptions {
  firebaseApp: any;
  db: DbAdapter;
  collectionModels: CollectionModel[];
  globalModels: GlobalModel[];
}

export interface DbAdapter {
  // Collection Models
  getCollectionModels: () => Promise<CollectionModel[]>;
  getCollectionModel: (slug: string) => Promise<CollectionModel | undefined>;
  deleteCollectionModel: (slug: string) => Promise<void>;
  createCollectionModel: (collectionModel: CollectionModel) => Promise<void>;
  updateCollectionModel: (collectionModel: CollectionModel) => Promise<void>;
  // Global Models
  getGlobalModels: () => Promise<GlobalModel[]>;
  getGlobalModel: (slug: string) => Promise<GlobalModel | undefined>;
  deleteGlobalModel: (slug: string) => Promise<void>;
  createGlobalModel: (globalModel: GlobalModel) => Promise<void>;
  updateGlobalModel: (globalModel: GlobalModel) => Promise<void>;
  // Collection Items 
  getCollectionItems: <T>(slug: string) => Promise<T[]>;
  getCollectionItemById: <T>(slug: string, id: string) => Promise<T | undefined>;
  deleteCollectionItem: (slug: string, id: string) => Promise<void>;
  createCollectionItem: <T>(slug: string, collectionItem: T) => Promise<void>;
  updateCollectionItem: <T>(collectionSlug: string, slug: string, collectionItem: T) => Promise<void>;
  // Global Items
  getGlobalItems: (slug: string) => Promise<GlobalItem[]>;
  getGlobalItemBySlug: (slug: string) => Promise<GlobalItem | undefined>;
  deleteGlobalItem: (slug: string) => Promise<void>;
  createGlobalItem: (slug: string, globalItem: GlobalItem) => Promise<void>;
  updateGlobalItem: (slug: string, globalItem: GlobalItem) => Promise<void>;
}

export interface CollectionModel {
  name: string;
  slug: string;
  fields: Field[];
}

export interface GlobalItem {
  id: string;
  data: Record<string, any>;
}

export interface Field {
  name: string;
  description?: string;
  type: string;
  label: string;
  required?: boolean;
  basedOn?: string;
  collection?: string;  
}

export interface GlobalModel {
  name: string;
  slug: string;
  fields: Field[];
}

export interface CmsNavData {
  type: "collection" | "global";
  name: string;
  slug: string;
}       

export interface UserModel {
  email: string;
  uid: string;
  displayName?: string;
  photoURL?: string;
}