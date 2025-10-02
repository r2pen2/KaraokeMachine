import { getFirestore, doc, getDoc, setDoc, updateDoc, getDocs, collection, writeBatch } from 'firebase/firestore';
import { getFirebaseApp } from '../firebase';
import type { Filament } from './models/filament';

export type AppUserDoc = {
  uid: string;
  filaments: string[];
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


