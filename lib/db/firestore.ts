import { getFirestore, doc, getDoc, setDoc, updateDoc, collection } from 'firebase/firestore';
import { getFirebaseApp } from '../firebase';
import type { Filament } from './models/filament';
import type { Product } from './models/product';

export type AppUserDoc = {
  uid: string;
  filaments: string[];
  products?: string[];
  orders?: string[];
};

export function db() {
  return getFirestore(getFirebaseApp());
}

export async function ensureUser(uid: string): Promise<AppUserDoc> {
  const ref = doc(db(), 'users', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    const newDoc: AppUserDoc = { uid, filaments: [] };
    await setDoc(ref, newDoc);
    return newDoc;
  }
  return snap.data() as AppUserDoc;
}

export async function readUser(uid: string): Promise<AppUserDoc | null> {
  const snap = await getDoc(doc(db(), 'users', uid));
  return snap.exists() ? (snap.data() as AppUserDoc) : null;
}

export async function appendUserFilament(uid: string, filamentId: string): Promise<void> {
  const ref = doc(db(), 'users', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, { uid, filaments: [filamentId] } as AppUserDoc);
    return;
  }
  const data = snap.data() as AppUserDoc;
  if (data.filaments.includes(filamentId)) { return; }
  await updateDoc(ref, { filaments: [...data.filaments, filamentId] });
}

export async function createFilamentDoc(filament: Omit<Filament, 'id'>): Promise<string> {
  const ref = doc(collection(db(), 'filaments'));
  await setDoc(ref, { ...filament, id: ref.id });
  return ref.id;
}

export async function getFilamentsByIds(ids: string[]): Promise<Filament[]> {
  if (!ids.length) { return []; }
  const batch = ids.map((id) => getDoc(doc(db(), 'filaments', id)));
  const snaps = await Promise.all(batch);
  return snaps.filter((s) => s.exists()).map((s) => s.data() as Filament);
}

export async function updateFilamentOwnedCount(id: string, numSpoolsOwned: number): Promise<void> {
  await updateDoc(doc(db(), 'filaments', id), { numSpoolsOwned });
}

export async function hideFilament(id: string): Promise<void> {
  await updateDoc(doc(db(), 'filaments', id), { hidden: true });
}

export async function updateFilamentDoc(id: string, updates: Partial<{ title: string; brand: string; href: string; colors: any[]; types: any[]; pricePerKilo: number; numSpoolsOwned: number; totalUsed: number }>): Promise<void> {
  await updateDoc(doc(db(), 'filaments', id), updates);
}

// Products
export async function appendUserProduct(uid: string, productId: string): Promise<void> {
  const ref = doc(db(), 'users', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, { uid, filaments: [], products: [productId] } as AppUserDoc);
    return;
  }
  const data = snap.data() as AppUserDoc;
  const cur = data.products || [];
  if (cur.includes(productId)) { return; }
  await updateDoc(ref, { products: [...cur, productId] });
}

export async function createProductDoc(product: Omit<Product, 'id'>): Promise<string> {
  const ref = doc(collection(db(), 'products'));
  await setDoc(ref, { ...product, id: ref.id });
  return ref.id;
}

export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  if (!ids.length) { return []; }
  const snaps = await Promise.all(ids.map((id) => getDoc(doc(db(), 'products', id))));
  return snaps.filter((s) => s.exists()).map((s) => s.data() as Product);
}

export async function updateProductDoc(id: string, updates: Partial<Product>): Promise<void> {
  await updateDoc(doc(db(), 'products', id), updates);
}

// Orders
export async function appendUserOrder(uid: string, orderId: string): Promise<void> {
  const ref = doc(db(), 'users', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, { uid, filaments: [], products: [], orders: [orderId] } as AppUserDoc);
    return;
  }
  const data = snap.data() as AppUserDoc;
  const cur = data.orders || [];
  if (cur.includes(orderId)) { return; }
  await updateDoc(ref, { orders: [...cur, orderId] });
}

export async function createOrderDoc(order: any): Promise<string> {
  const ref = doc(collection(db(), 'orders'));
  await setDoc(ref, { ...order, id: ref.id });
  return ref.id;
}

export async function getOrdersByIds(ids: string[]): Promise<any[]> {
  if (!ids.length) { return []; }
  const snaps = await Promise.all(ids.map((id) => getDoc(doc(db(), 'orders', id))));
  return snaps.filter((s) => s.exists()).map((s) => s.data());
}

export async function updateOrderDoc(id: string, updates: any): Promise<void> {
  await updateDoc(doc(db(), 'orders', id), updates);
}

export async function hideOrder(id: string): Promise<void> {
  await updateDoc(doc(db(), 'orders', id), { hidden: true });
}

