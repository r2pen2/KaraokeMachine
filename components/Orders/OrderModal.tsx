'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ActionIcon, Button, Divider, Group, Modal, NumberInput, Paper, Select, Stack, Tabs, Text, TextInput } from '@mantine/core';
import FilamentBadge from '../Filaments/FilamentBadge';
import { IconCopy, IconTrash } from '@tabler/icons-react';
import { useProducts } from '../../context/ProductsContext';
import { useFilaments } from '../../context/FilamentsContext';
import { useAuth } from '../../context/AuthContext';
import { useOrders } from '../../context/OrdersContext';
import { createOrderDoc, appendUserOrder } from '../../lib/db/firestore';
import type { OrderPiece, Order } from '../../lib/db/models/order';

type Props = { 
  opened: boolean; 
  onClose: () => void;
  order?: Order;
};

export default function OrderModal({ opened, onClose, order }: Props) {
  const { products } = useProducts();
  const { filaments } = useFilaments();
  const { user } = useAuth();
  const { addOrder, updateOrder } = useOrders();

  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [pieces, setPieces] = useState<OrderPiece[]>([]);

  // Initialize form when editing
  useEffect(() => {
    if (order && opened) {
      setTitle(order.title);
      setDueDate(order.dueDate);
      setPieces(order.pieces);
      setActiveTab(order.pieces.length > 0 ? '0' : null);
    } else if (!opened) {
      // Reset when modal closes
      setTitle('');
      setDueDate(null);
      setPieces([]);
      setActiveTab(null);
      setSelectValue(null);
    }
  }, [order, opened]);

  const filamentOptions = useMemo(
    () => filaments
      .filter((f) => !f.hidden)
      .map((f) => ({ value: f.id, label: `${f.title} (${f.brand})`, filament: f } as any)),
    [filaments]
  );
  const productOptions = useMemo(() => products.filter(p => !p.hidden).map(p => ({ value: p.id, label: p.title, product: p } as any)), [products]);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [selectValue, setSelectValue] = useState<string | null>(null);

  function addProduct(pid?: string) {
    const p = products.find(x => x.id === (pid || products[0]?.id));
    if (!p) { return; }
    const piece: OrderPiece = {
      productId: p.id,
      productTitle: p.title,
      quantity: 1,
      price: typeof p.prices === 'number' ? p.prices : 0,
      parts: p.filaments.map(req => ({ label: req.label, requiredWeightGrams: req.weightGrams }))
    };
    setPieces(prev => {
      const next = [...prev, piece];
      setActiveTab(String(next.length - 1));
      return next;
    });
  }

  function duplicatePiece(idx: number) {
    setPieces((prev) => {
      const copy = [...prev];
      copy.splice(idx + 1, 0, JSON.parse(JSON.stringify(prev[idx])));
      setActiveTab(String(idx + 1));
      return copy;
    });
  }

  function updatePiece(idx: number, patch: Partial<OrderPiece>) {
    setPieces(prev => prev.map((p, i) => i === idx ? { ...p, ...patch } : p));
  }

  function updatePart(pieceIdx: number, partIdx: number, patch: Partial<OrderPiece['parts'][number]>) {
    setPieces(prev => prev.map((piece, i) => i === pieceIdx ? {
      ...piece,
      parts: piece.parts.map((part, j) => j === partIdx ? { ...part, ...patch } : part)
    } : piece));
  }

  function removePiece(idx: number) {
    setPieces((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      if (next.length > 0) {
        const newIndex = Math.min(idx, next.length - 1);
        setActiveTab(String(newIndex));
      } else {
        setActiveTab(null);
      }
      return next;
    });
  }

  async function handleSubmit() {
    // Validate: must have title and all pieces must have filament selections + price
    if (!title.trim()) {
      // eslint-disable-next-line no-alert
      alert('Order title is required');
      return;
    }
    if (!user) {
      // eslint-disable-next-line no-alert
      alert('You must be signed in to create an order');
      return;
    }
    for (const piece of pieces) {
      for (const part of piece.parts) {
        if (!part.selectedFilamentId) {
          // eslint-disable-next-line no-alert
          alert(`Please select a filament for all parts in ${piece.productTitle}`);
          return;
        }
      }
      if (!piece.price || piece.price <= 0) {
        // eslint-disable-next-line no-alert
        alert(`Please set a price for ${piece.productTitle}`);
        return;
      }
    }

    try {
      if (order) {
        // Editing existing order
        const updates = {
          title: title.trim(),
          dueDate: dueDate || null,
          pieces,
          totalsByFilament: totals.byFilament,
          revenue: totals.revenue,
          expenses: totals.expenses || 0,
          profit: totals.profit
        };
        await updateOrder(order.id, updates);
        onClose();
      } else {
        // Creating new order
        const newOrder = {
          ownerUid: user.uid,
          hidden: false,
          status: 'Not Started' as const,
          title: title.trim(),
          dueDate: dueDate || null,
          pieces,
          totalsByFilament: totals.byFilament,
          revenue: totals.revenue,
          expenses: totals.expenses || 0,
          profit: totals.profit,
          printedCounts: {}
        };
        const orderId = await createOrderDoc(newOrder);
        await appendUserOrder(user.uid, orderId);
        // Optimistically add to UI
        addOrder({ ...newOrder, id: orderId });
        onClose();
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error saving order:', error);
      // eslint-disable-next-line no-alert
      alert('Failed to save order. Please try again.');
    }
  }

  const totals = useMemo(() => {
    const byFilament: Record<string, { totalWeightGrams: number; totalPrice: number }> = {};
    let revenue = 0;
    let expensesSum = 0;
    let hasAnySelected = false;
    for (const piece of pieces) {
      for (const part of piece.parts) {
        const weight = part.requiredWeightGrams * piece.quantity;
        const filamentId = part.selectedFilamentId || 'unassigned';
        byFilament[filamentId] = byFilament[filamentId] || { totalWeightGrams: 0, totalPrice: 0 };
        byFilament[filamentId].totalWeightGrams += weight;
        if (part.selectedFilamentId) {
          const f = filaments.find((x) => x.id === part.selectedFilamentId);
          if (f) {
            const cost = (weight / 1000) * (f.pricePerKilo || 0);
            byFilament[filamentId].totalPrice += cost;
            expensesSum += cost;
            hasAnySelected = true;
          }
        }
      }
      if (piece.price) { revenue += (piece.price * piece.quantity); }
    }
    const expenses = hasAnySelected ? expensesSum : undefined;
    const profit = expenses !== undefined ? (revenue - expenses) : revenue;
    return { byFilament, revenue, expenses, profit };
  }, [pieces, filaments]);

  return (
    <Modal opened={opened} onClose={onClose} title={order ? "Edit order" : "Create order"} size="lg" centered>
      <Stack>
        <Group justify="space-between" align="flex-end">
          <TextInput label="Order title" value={title} onChange={(e) => setTitle(e.currentTarget.value)} w={320} />
          <TextInput label="Due date" type="date" value={dueDate ?? ''} onChange={(e) => setDueDate(e.currentTarget.value || null)} w={220} />
        </Group>

        <Group>
          <Select
            placeholder="Select product"
            data={productOptions}
            value={selectValue}
            onChange={(v) => {
              if (v) { addProduct(v); }
              setSelectValue(null);
            }}
            clearable
            w={280}
            renderOption={({ option }) => {
              const p = (option as any).product as typeof products[number] | undefined;
              return (
                <Group justify="space-between" wrap="nowrap">
                  <Group gap={6} wrap="nowrap">
                    {p?.sketchDataUrl && (<img src={p.sketchDataUrl} alt="icon" style={{ width: 18, height: 18 }} />)}
                    <Text size="sm">{option.label}</Text>
                  </Group>
                </Group>
              );
            }}
          />
        </Group>

        <Tabs value={activeTab} onChange={setActiveTab} keepMounted={false}>
          <Tabs.List>
            {pieces.map((piece, idx) => {
              const p = products.find(pr => pr.id === piece.productId);
              return (
                <Tabs.Tab key={idx} value={String(idx)}>
                  <Group gap={6} wrap="nowrap">
                    {p?.sketchDataUrl && (<img src={p.sketchDataUrl} alt="icon" style={{ width: 18, height: 18 }} />)}
                    <span>{piece.productTitle} x{piece.quantity}</span>
                    <Group gap={4} wrap="nowrap">
                    {piece.parts.filter(part => part.selectedFilamentId).map((part, i) => {
                      const f = filaments.find(x => x.id === part.selectedFilamentId);
                      return f ? <FilamentBadge key={i} colors={f.colors as any} types={f.types as any} width={14} heightPx={6} /> : null;
                    })}
                    </Group>
                  </Group>
                </Tabs.Tab>
              );
            })}
          </Tabs.List>
          {pieces.map((piece, idx) => (
            <Tabs.Panel key={idx} value={String(idx)} pt="xs">
              <Paper withBorder p="sm">
                <Group justify="space-between" mb={6}>
                  <Group gap={6}>
                    <Text fw={600}>{piece.productTitle}</Text>
                  </Group>
                  <Group gap={6}>
                    <NumberInput label="Qty" min={1} value={piece.quantity} onChange={(v) => updatePiece(idx, { quantity: typeof v === 'number' ? v : 1 })} w={120} />
                    <NumberInput label="Price" min={0} value={piece.price ?? ''} onChange={(v) => updatePiece(idx, { price: typeof v === 'number' ? v : undefined })} w={160} />
                    <ActionIcon variant="subtle" onClick={() => duplicatePiece(idx)} title="Duplicate"><IconCopy size={14} /></ActionIcon>
                    <ActionIcon color="red" variant="subtle" onClick={() => removePiece(idx)} title="Remove"><IconTrash size={14} /></ActionIcon>
                  </Group>
                </Group>
                <Stack>
                  {piece.parts.map((part, pidx) => (
                    <Group key={pidx} justify="space-between">
                      <Text size="sm">{part.label} – {part.requiredWeightGrams} g</Text>
                      <Group gap={6}>
                        <Select
                          placeholder="Pick filament"
                          data={filamentOptions}
                          value={part.selectedFilamentId}
                          onChange={(v) => updatePart(idx, pidx, { selectedFilamentId: v || undefined })}
                          w={280}
                          searchable
                          renderOption={({ option }) => {
                            const f = (option as any).filament as typeof filaments[number] | undefined;
                            return (
                              <Group justify="space-between" wrap="nowrap">
                                <Group gap={6} wrap="nowrap">
                                  <FilamentBadge colors={(f?.colors as any) || ([ '#999999' ] as any)} types={(f?.types as any) || (['normal'] as any)} width={36} />
                                  <Text size="sm">{option.label}</Text>
                                </Group>
                                <Text size="xs" c="dimmed">${(f?.pricePerKilo ?? 0).toFixed(2)}/kg</Text>
                              </Group>
                            );
                          }}
                        />
                      </Group>
                    </Group>
                  ))}
                </Stack>
              </Paper>
            </Tabs.Panel>
          ))}
        </Tabs>

        <Divider />
        <Stack>
          <Text fw={600} size="sm">Totals by filament</Text>
          <Stack gap={4}>
            {Object.entries(totals.byFilament).map(([fid, t]) => (
              <Text key={fid} size="xs">{fid === 'unassigned' ? 'Unassigned' : (filaments.find((f) => f.id === fid)?.title || fid)}: {t.totalWeightGrams.toFixed(0)} g – ${t.totalPrice.toFixed(2)}</Text>
            ))}
          </Stack>
          <Text size="sm">Revenue ${totals.revenue.toFixed(2)} - Expenses {totals.expenses !== undefined ? `$${totals.expenses.toFixed(2)}` : '—'} = Profit ${totals.profit.toFixed(2)}</Text>
        </Stack>

        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>{order ? "Save Changes" : "Create Order"}</Button>
        </Group>
      </Stack>
    </Modal>
  );
}


