import { deleteDoc, Firestore, setDoc, updateDoc } from '@firebase/firestore';
import { getFirestore } from '@firebase/firestore';
import { doc, getDoc, collection, query, getDocs } from "@firebase/firestore";
import type { GlobalModel, CollectionModel, GlobalItem, UserModel, DbAdapter, } from '@treesap/treesap';


export class FirestoreDbAdapter implements DbAdapter {
  firebaseApp: any;

  private db: Firestore;

  private globalModelsCollection: string = 'globalModels';
  private globalItemsCollection: string = 'globalItems';
  private collectionModelsCollection: string = 'collectionModels';
  private usersCollection: string = 'users';

  constructor(firebaseApp: any) {
    this.firebaseApp = firebaseApp;
    this.db = getFirestore(this.firebaseApp);
  }

  // Global Models
  async getGlobalModels(): Promise<GlobalModel[]> {
    const q = query(collection(this.db, this.globalModelsCollection));
    const querySnapshot = await getDocs(q);
    const globals: GlobalModel[] = [];
    querySnapshot.forEach((doc) => {
      globals.push(doc.data() as GlobalModel);
    });
    return globals;
  }

  async getGlobalModel(globalSlug: string): Promise<GlobalModel | undefined> {
    const docRef = doc(this.db, this.globalModelsCollection, globalSlug);
    const docSnap = await getDoc(docRef);
    return docSnap.data() as GlobalModel;
  }

  async createGlobalModel(globalModel: GlobalModel) {
    const docRef = doc(collection(this.db, this.globalModelsCollection), globalModel.slug);
    return setDoc(docRef, globalModel);
  }

  async updateGlobalModel(globalModel: GlobalModel) {
    const docRef = doc(this.db, this.globalModelsCollection, globalModel.slug);
    return setDoc(docRef, globalModel);
  }

  async deleteGlobalModel(globalSlug: string) {
    const docRef = doc(this.db, this.globalModelsCollection, globalSlug);
    return deleteDoc(docRef);
  }

  // Global Items
  async getGlobalItems(globalSlug: string): Promise<GlobalItem[]> {
    const q = query(collection(this.db, this.globalItemsCollection, globalSlug));
    const querySnapshot = await getDocs(q);
    const items: GlobalItem[] = [];
    querySnapshot.forEach((doc) => {
      items.push(doc.data() as GlobalItem);
    });
    return items;
  }

  async getGlobalItemBySlug(globalSlug: string): Promise<GlobalItem | undefined> {
    const docRef = doc(this.db, this.globalItemsCollection, globalSlug);
    const docSnap = await getDoc(docRef);
    return docSnap.data() as GlobalItem;
  }

  async createGlobalItem(globalSlug: string, globalItem: GlobalItem) {
    const docRef = doc(this.db, this.globalItemsCollection, globalSlug);
    return setDoc(docRef, globalItem);
  }

  async deleteGlobalItem(globalSlug: string) {
    const docRef = doc(this.db, this.globalItemsCollection, globalSlug);
    return deleteDoc(docRef);
  }

  async updateGlobalItem(globalSlug: string, globalItem: GlobalItem) {
    const docRef = doc(this.db, this.globalItemsCollection, globalSlug);
    return setDoc(docRef, globalItem);
  }

  // Collection Models
  async getCollectionModels(): Promise<CollectionModel[]> {
    const q = query(collection(this.db, this.collectionModelsCollection));
    const querySnapshot = await getDocs(q);
    const collections: CollectionModel[] = [];
    querySnapshot.forEach((doc) => {
      collections.push(doc.data() as CollectionModel);
    });
    return collections;
  }

  async getCollectionModel(collectionSlug: string): Promise<CollectionModel | undefined> {
    const docRef = doc(this.db, this.collectionModelsCollection, collectionSlug);
    const docSnap = await getDoc(docRef);
    return docSnap.data() as CollectionModel;
  }

  async createCollectionModel(collectionModel: CollectionModel) {
    const docRef = doc(collection(this.db, this.collectionModelsCollection), collectionModel.slug);
    return setDoc(docRef, collectionModel);
  }

  async updateCollectionModel(collectionModel: CollectionModel) {
    const docRef = doc(this.db, this.collectionModelsCollection, collectionModel.slug);
    return setDoc(docRef, collectionModel);
  }

  async deleteCollectionModel(collectionName: string) {
    const docRef = doc(this.db, this.collectionModelsCollection, collectionName);
    return deleteDoc(docRef);
  }

  // Collection Items
  async getCollectionItems<T>(collectionSlug: string): Promise<T[]> {
    // get all the items in a collection
    const q = query(collection(this.db, collectionSlug));
    const querySnapshot = await getDocs(q);
    const items: T[] = [];
    querySnapshot.forEach((doc) => {
      items.push(doc.data() as T);
    });
    return items;
  }

  async getCollectionItemById<T>(collectionSlug: string, id: string) {
    const docRef = doc(this.db, collectionSlug, id);
    const docSnap = await getDoc(docRef);
    return docSnap.data() as T;
  }

  async createCollectionItem<T>(collectionSlug: string, collectionItem: T) {
    // create a new document in the collection
    const collectionRef = collection(this.db, collectionSlug);
    const docRef = doc(collectionRef);
    // get the id of the new item
    const id = docRef.id;
    // create a new item with the id
    const newItem = {
      ...collectionItem,
      id,
    }
    // set the new item
    return setDoc(docRef, newItem);
  }

  async updateCollectionItem<T>(collectionSlug: string, id: string, collectionItem: T) {
    const docRef = doc(this.db, collectionSlug, id);
    return setDoc(docRef, collectionItem as any);
  }

  async deleteCollectionItem(collectionSlug: string, id: string) {
    const docRef = doc(this.db, collectionSlug, id);
    return deleteDoc(docRef);
  }

  // USERS

  async createNewUser(user: UserModel) {
    const docRef = doc(this.db, this.usersCollection, user.uid);
    return setDoc(docRef, user);
  }

}
