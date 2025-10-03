'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { readUser, getOrdersByIds, updateOrderDoc, hideOrder } from '../lib/db/firestore';
import type { Order } from '../lib/db/models/order';

type OrdersContextValue = {
  orders: Order[];
  refresh: () => Promise<void>;
  addOrder: (order: Order) => void;
  updateOrder: (id: string, updates: Partial<Order>) => Promise<void>;
  softDelete: (id: string) => Promise<void>;
  restoreOrder: (id: string) => Promise<void>;
  markPrinted: (id: string) => Promise<void>;
  markDone: (id: string) => Promise<void>;
  updatePrintedCount: (id: string, pieceIdx: number, count: number) => Promise<void>;
};

const OrdersContext = createContext<OrdersContextValue | undefined>(undefined);

export function OrdersProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);

  const refresh = useCallback(async () => {
    if (!user) {
      setOrders([]);
      return;
    }
    const userDoc = await readUser(user.uid);
    if (!userDoc?.orders?.length) {
      setOrders([]);
      return;
    }
    const data = await getOrdersByIds(userDoc.orders);
    setOrders(data as Order[]);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addOrder = useCallback((order: Order) => {
    setOrders(prev => [...prev, order]);
  }, []);

  const updateOrder = useCallback(async (id: string, updates: Partial<Order>) => {
    await updateOrderDoc(id, updates);
    setOrders(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o));
  }, []);

  const softDelete = useCallback(async (id: string) => {
    await hideOrder(id);
    setOrders(prev => prev.map(o => o.id === id ? { ...o, hidden: true } : o));
  }, []);

  const restoreOrder = useCallback(async (id: string) => {
    // Restore from "Done" back to "Printed"
    await updateOrderDoc(id, { status: 'Printed' });
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'Printed' } : o));
  }, []);

  const markPrinted = useCallback(async (id: string) => {
    const order = orders.find(o => o.id === id);
    if (!order) { return; }
    const printedCounts: Record<number, number> = {};
    order.pieces.forEach((piece, idx) => {
      printedCounts[idx] = piece.quantity;
    });
    await updateOrderDoc(id, { status: 'Printed', printedCounts });
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'Printed', printedCounts } : o));
  }, [orders]);

  const markDone = useCallback(async (id: string) => {
    await updateOrderDoc(id, { status: 'Done' });
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'Done' } : o));
  }, []);

  const updatePrintedCount = useCallback(async (id: string, pieceIdx: number, count: number) => {
    const order = orders.find(o => o.id === id);
    if (!order) { return; }
    const printedCounts = { ...order.printedCounts, [pieceIdx]: count };
    
    // Auto-update status based on printed counts
    let newStatus = order.status;
    const allCounts = Object.values(printedCounts);
    const hasAnyPrinted = allCounts.some(c => c > 0);
    const allPrinted = order.pieces.every((piece, idx) => (printedCounts[idx] || 0) === piece.quantity);
    
    if (!hasAnyPrinted) {
      newStatus = 'Not Started';
    } else if (allPrinted) {
      newStatus = 'Printed';
    } else if (hasAnyPrinted) {
      newStatus = 'Printing';
    }
    
    await updateOrderDoc(id, { printedCounts, status: newStatus });
    setOrders(prev => prev.map(o => o.id === id ? { ...o, printedCounts, status: newStatus } : o));
  }, [orders]);

  return (
    <OrdersContext.Provider value={{ orders, refresh, addOrder, updateOrder, softDelete, restoreOrder, markPrinted, markDone, updatePrintedCount }}>
      {children}
    </OrdersContext.Provider>
  );
}

export function useOrders() {
  const ctx = useContext(OrdersContext);
  if (!ctx) { throw new Error('useOrders must be used within OrdersProvider'); }
  return ctx;
}

