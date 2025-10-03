'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { appendUserFilament, getFilamentsByIds, readUser, createFilamentDoc, updateFilamentOwnedCount, hideFilament, updateFilamentDoc } from '../lib/db/firestore';
import type { Filament } from '../lib/db/models/filament';

type FilamentsContextValue = {
  filaments: Filament[];
  refresh: () => Promise<void>;
  createFilament: (f: Omit<Filament, 'id'>) => Promise<string>;
  updateOwned: (id: string, owned: number) => Promise<void>;
  softDelete: (id: string) => Promise<void>;
  updateFilament: (id: string, updates: Partial<Filament>) => Promise<void>;
  duplicateFilament: (id: string) => Promise<string | null>;
};

const FilamentsContext = createContext<FilamentsContextValue | undefined>(undefined);

export function FilamentsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [filaments, setFilaments] = useState<Filament[]>([]);

  const refresh = async () => {
    if (!user) { setFilaments([]); return; }
    const u = await readUser(user.uid);
    const items = await getFilamentsByIds(u?.filaments || []);
    setFilaments(items);
  };

  useEffect(() => { refresh(); }, [user]);

  const createFilament = async (f: Omit<Filament, 'id'>) => {
    if (!user) { throw new Error('Not signed in'); }
    const payload: Omit<Filament, 'id'> = { ...f, ownerUid: user.uid, hidden: false } as Omit<Filament, 'id'>;
    const id = await createFilamentDoc(payload);
    if (user) {
      await appendUserFilament(user.uid, id);
    }
    setFilaments((prev) => [...prev, { ...(payload as Filament), id }]);
    return id;
  };

  const updateOwned = async (id: string, owned: number) => {
    setFilaments((prev) => prev.map((x) => (x.id === id ? { ...x, numSpoolsOwned: owned } : x)));
    await updateFilamentOwnedCount(id, owned);
  };

  const softDelete = async (id: string) => {
    setFilaments((prev) => prev.filter((x) => x.id !== id));
    await hideFilament(id);
  };

  const updateFilament = async (id: string, updates: Partial<Filament>) => {
    setFilaments((prev) => prev.map((x) => (x.id === id ? { ...x, ...updates } : x)));
    await updateFilamentDoc(id, updates);
  };

  const duplicateFilament = async (id: string) => {
    const f = filaments.find((x) => x.id === id);
    if (!f) { return null; }
    const { id: _ignored, ownerUid, hidden, ...rest } = f as any;
    const newId = await createFilamentDoc({ ...(rest as any), ownerUid, hidden: false });
    setFilaments((prev) => [...prev, { ...(f as any), id: newId, hidden: false }]);
    if (user) { await appendUserFilament(user.uid, newId); }
    return newId;
  };

  const value = useMemo(() => ({ filaments, refresh, createFilament, updateOwned, softDelete, updateFilament, duplicateFilament }), [filaments]);

  return <FilamentsContext.Provider value={value}>{children}</FilamentsContext.Provider>;
}

export function useFilaments() {
  const ctx = useContext(FilamentsContext);
  if (!ctx) { throw new Error('useFilaments must be used within FilamentsProvider'); }
  return ctx;
}


