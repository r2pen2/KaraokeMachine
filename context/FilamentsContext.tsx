'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { appendUserFilament, getFilamentsByIds, readUser, createFilamentDoc, updateFilamentOwnedCount } from '../lib/db/firestore';
import type { Filament } from '../lib/db/models/filament';

type FilamentsContextValue = {
  filaments: Filament[];
  refresh: () => Promise<void>;
  createFilament: (f: Omit<Filament, 'id'>) => Promise<string>;
  updateOwned: (id: string, owned: number) => Promise<void>;
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
    const payload = user ? { ...f, ownerUid: user.uid } : f;
    const id = await createFilamentDoc(payload as Omit<Filament, 'id'>);
    if (user) {
      await appendUserFilament(user.uid, id);
    }
    setFilaments((prev) => [...prev, { ...payload, id } as Filament]);
    return id;
  };

  const updateOwned = async (id: string, owned: number) => {
    setFilaments((prev) => prev.map((x) => (x.id === id ? { ...x, numSpoolsOwned: owned } : x)));
    await updateFilamentOwnedCount(id, owned);
  };

  const value = useMemo(() => ({ filaments, refresh, createFilament, updateOwned }), [filaments]);

  return <FilamentsContext.Provider value={value}>{children}</FilamentsContext.Provider>;
}

export function useFilaments() {
  const ctx = useContext(FilamentsContext);
  if (!ctx) { throw new Error('useFilaments must be used within FilamentsProvider'); }
  return ctx;
}


