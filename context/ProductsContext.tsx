'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { appendUserProduct, createProductDoc, getProductsByIds, readUser, updateProductDoc } from '../lib/db/firestore';
import type { Product } from '../lib/db/models/product';

type ProductsContextValue = {
  products: Product[];
  refresh: () => Promise<void>;
  createProduct: (p: Omit<Product, 'id'>) => Promise<string>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
};

const ProductsContext = createContext<ProductsContextValue | undefined>(undefined);

export function ProductsProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);

  const refresh = async () => {
    if (!user) { setProducts([]); return; }
    const u = await readUser(user.uid);
    const items = await getProductsByIds(u?.products || []);
    setProducts(items);
  };

  useEffect(() => { refresh(); }, [user]);

  const createProduct = async (p: Omit<Product, 'id'>) => {
    if (!user) { throw new Error('Not signed in'); }
    const payload = { ...p, ownerUid: user.uid, hidden: false } as Omit<Product, 'id'>;
    const id = await createProductDoc(payload);
    await appendUserProduct(user.uid, id);
    setProducts((prev) => [...prev, { ...(payload as Product), id }]);
    return id;
  };

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    setProducts((prev) => prev.map((x) => (x.id === id ? { ...x, ...updates } : x)));
    await updateProductDoc(id, updates);
  };

  const value = useMemo(() => ({ products, refresh, createProduct, updateProduct }), [products]);
  return <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>;
}

export function useProducts() {
  const ctx = useContext(ProductsContext);
  if (!ctx) { throw new Error('useProducts must be used within ProductsProvider'); }
  return ctx;
}


