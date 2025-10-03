'use client';

import React, { useMemo, useState } from 'react';
import { ActionIcon, Badge, Center, Group, NumberInput, Paper, Stack, Switch, Table, Text, Tooltip } from '@mantine/core';
import { IconCheck, IconPencil, IconPrinter, IconRestore, IconTrash } from '@tabler/icons-react';
import { useOrders } from '../../context/OrdersContext';
import { useFilaments } from '../../context/FilamentsContext';
import FilamentBadge from '../Filaments/FilamentBadge';
import type { Order } from '../../lib/db/models/order';

type SortKey = 'title' | 'dueDate' | 'status' | 'revenue' | 'profit';

function HeaderSortButton({ label, sortKey, currentSort, onSort }: { label: string; sortKey: SortKey; currentSort: { key: SortKey; dir: 'asc' | 'desc' }; onSort: (key: SortKey) => void }) {
  const active = currentSort.key === sortKey;
  return (
    <Text
      component="button"
      onClick={() => onSort(sortKey)}
      style={{ cursor: 'pointer', fontWeight: active ? 700 : 500, textDecoration: active ? 'underline' : 'none', background: 'none', border: 'none', padding: 0 }}
    >
      {label} {active && (currentSort.dir === 'asc' ? '↑' : '↓')}
    </Text>
  );
}

type Props = {
  onEdit?: (order: Order) => void;
};

export default function OrdersTable({ onEdit }: Props) {
  const { orders, softDelete, markPrinted, markDone, updatePrintedCount, restoreOrder } = useOrders();
  const { filaments } = useFilaments();
  const [sort, setSort] = useState<{ key: SortKey; dir: 'asc' | 'desc' }>({ key: 'dueDate', dir: 'asc' });
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [showDone, setShowDone] = useState(false);

  const visibleOrders = useMemo(() => {
    // Always hide orders that are hidden
    const notHidden = orders.filter(o => !o.hidden);
    // Optionally filter out "Done" orders
    if (showDone) {
      return notHidden;
    }
    return notHidden.filter(o => o.status !== 'Done');
  }, [orders, showDone]);

  const sorted = useMemo(() => {
    const copy = [...visibleOrders];
    copy.sort((a, b) => {
      let aVal: any = a[sort.key];
      let bVal: any = b[sort.key];
      if (sort.key === 'dueDate') {
        aVal = a.dueDate ? new Date(a.dueDate).getTime() : 0;
        bVal = b.dueDate ? new Date(b.dueDate).getTime() : 0;
      }
      if (aVal == null) { return 1; }
      if (bVal == null) { return -1; }
      if (aVal < bVal) { return sort.dir === 'asc' ? -1 : 1; }
      if (aVal > bVal) { return sort.dir === 'asc' ? 1 : -1; }
      return 0;
    });
    return copy;
  }, [visibleOrders, sort]);

  function toggleSort(key: SortKey) {
    setSort(prev => ({ key, dir: prev.key === key && prev.dir === 'asc' ? 'desc' : 'asc' }));
  }

  function handleDelete(id: string) {
    // eslint-disable-next-line no-alert
    if (window.confirm('Delete this order? This cannot be undone.')) {
      softDelete(id);
    }
  }

  function handlePrinted(id: string) {
    markPrinted(id);
  }

  function handleDone(id: string) {
    markDone(id);
  }

  function handleRestore(id: string) {
    restoreOrder(id);
  }

  function handleEdit(order: Order) {
    if (onEdit) {
      onEdit(order);
    }
  }

  function toggleExpand(id: string) {
    setExpandedRow(prev => prev === id ? null : id);
  }

  const statusColors: Record<string, string> = {
    'Not Started': 'gray',
    'Printing': 'blue',
    'Printed': 'green',
    'Done': 'teal'
  };

  return (
    <Paper withBorder>
      <Group justify="flex-end" p="sm">
        <Switch
          label="Show done orders"
          checked={showDone}
          onChange={(e) => setShowDone(e.currentTarget.checked)}
        />
      </Group>
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th><HeaderSortButton label="Title" sortKey="title" currentSort={sort} onSort={toggleSort} /></Table.Th>
            <Table.Th><HeaderSortButton label="Due Date" sortKey="dueDate" currentSort={sort} onSort={toggleSort} /></Table.Th>
            <Table.Th><HeaderSortButton label="Status" sortKey="status" currentSort={sort} onSort={toggleSort} /></Table.Th>
            <Table.Th><HeaderSortButton label="Revenue" sortKey="revenue" currentSort={sort} onSort={toggleSort} /></Table.Th>
            <Table.Th><HeaderSortButton label="Profit" sortKey="profit" currentSort={sort} onSort={toggleSort} /></Table.Th>
            <Table.Th>ACTIONS</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {sorted.map((order) => (
            <React.Fragment key={order.id}>
              <Table.Tr onClick={() => toggleExpand(order.id)} style={{ cursor: 'pointer', opacity: order.status === 'Done' ? 0.5 : 1 }}>
                <Table.Td>{order.title}</Table.Td>
                <Table.Td>{order.dueDate ? new Date(order.dueDate).toLocaleDateString() : '—'}</Table.Td>
                <Table.Td><Badge color={statusColors[order.status] || 'gray'}>{order.status}</Badge></Table.Td>
                <Table.Td>${order.revenue.toFixed(2)}</Table.Td>
                <Table.Td>${order.profit.toFixed(2)}</Table.Td>
                <Table.Td onClick={(e) => e.stopPropagation()}>
                  <Group gap={4}>
                    {order.status === 'Done' ? (
                      <Tooltip label="Restore to Printed"><ActionIcon variant="subtle" size="sm" color="blue" onClick={() => handleRestore(order.id)}><IconRestore size={14} /></ActionIcon></Tooltip>
                    ) : (
                      <>
                        <Tooltip label="Edit"><ActionIcon variant="subtle" size="sm" onClick={() => handleEdit(order)}><IconPencil size={14} /></ActionIcon></Tooltip>
                        <Tooltip label="Mark Printed"><ActionIcon variant="subtle" size="sm" color="green" onClick={() => handlePrinted(order.id)}><IconPrinter size={14} /></ActionIcon></Tooltip>
                        <Tooltip label="Mark Done"><ActionIcon variant="subtle" size="sm" color="teal" onClick={() => handleDone(order.id)}><IconCheck size={14} /></ActionIcon></Tooltip>
                        <Tooltip label="Delete"><ActionIcon variant="subtle" size="sm" color="red" onClick={() => handleDelete(order.id)}><IconTrash size={14} /></ActionIcon></Tooltip>
                      </>
                    )}
                  </Group>
                </Table.Td>
              </Table.Tr>
              {expandedRow === order.id && (
                <Table.Tr>
                  <Table.Td colSpan={6} style={{ padding: '1rem 2rem', background: 'var(--mantine-color-dark-8)' }}>
                    <Text size="sm" fw={600} mb="xs">Products in this order:</Text>
                    <Table striped>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>Product</Table.Th>
                          <Table.Th>Quantity</Table.Th>
                          <Table.Th>Printed</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {order.pieces.map((piece, idx) => (
                          <Table.Tr key={idx}>
                            <Table.Td>
                              <Stack gap={4}>
                                <Text size="sm">{piece.productTitle}</Text>
                                <Group gap={6} wrap="nowrap">
                                  {piece.parts.map((part, pidx) => {
                                    const filament = filaments.find(f => f.id === part.selectedFilamentId);
                                    if (!filament) return null;
                                    return (
                                      <Group key={pidx} gap={4} wrap="nowrap">
                                        <Text size="xs" c="dimmed">{filament.title}</Text>
                                        <FilamentBadge 
                                          colors={filament.colors as any} 
                                          types={filament.types as any} 
                                          width={14} 
                                          heightPx={6} 
                                        />
                                      </Group>
                                    );
                                  })}
                                </Group>
                              </Stack>
                            </Table.Td>
                            <Table.Td>{piece.quantity}</Table.Td>
                            <Table.Td>
                              <NumberInput
                                value={order.printedCounts?.[idx] || 0}
                                onChange={(v) => updatePrintedCount(order.id, idx, typeof v === 'number' ? v : 0)}
                                min={0}
                                max={piece.quantity}
                                w={100}
                                size="xs"
                              />
                            </Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  </Table.Td>
                </Table.Tr>
              )}
            </React.Fragment>
          ))}
        </Table.Tbody>
      </Table>
      {sorted.length === 0 && (
        <Center p="xl">
          <Text c="dimmed">No orders yet.</Text>
        </Center>
      )}
    </Paper>
  );
}

