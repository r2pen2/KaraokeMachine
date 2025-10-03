'use client';

import React, { useMemo, useState } from 'react';
import { Group, NumberInput, Paper, Table, Text, UnstyledButton, ActionIcon, Tooltip, Modal, Button, Center } from '@mantine/core';
import FilamentBadge from './FilamentBadge';
import { useFilaments } from '../../context/FilamentsContext';
import { Filament } from '../../lib/db/models/filament';
import AddFilamentModal from './AddFilamentModal';
import { IconChevronDown, IconChevronUp, IconSelector, IconTrash, IconExternalLink, IconPencil, IconCopy } from '@tabler/icons-react';

type SortKey = 'title' | 'brand' | 'pricePerKilo' | 'numSpoolsOwned' | 'totalUsed';

function SortIcon({ sorted, reversed }: { sorted: boolean; reversed: boolean }) {
  return sorted ? (reversed ? <IconChevronUp size="1rem" /> : <IconChevronDown size="1rem" />) : <IconSelector size="1rem" />;
}

function HeaderSortButton({ label, sorted, reversed, onClick }: { label: string; sorted: boolean; reversed: boolean; onClick: () => void }) {
  return (
    <UnstyledButton className="w-100" onClick={onClick}>
      <Group justify="space-between">
        <Text fw={500} fz="sm">{label}</Text>
        <Center>
          <SortIcon sorted={sorted} reversed={reversed} />
        </Center>
      </Group>
    </UnstyledButton>
  );
}

function sortFilaments(data: Filament[], sortBy: SortKey, reversed: boolean) {
  const sorted = [...data].sort((a, b) => {
    const av = a[sortBy];
    const bv = b[sortBy];
    if (typeof av === 'number' && typeof bv === 'number') {
      return av - bv;
    }
    return String(av).localeCompare(String(bv));
  });
  return reversed ? sorted.reverse() : sorted;
}

/**
 * FilamentsTable renders the user's filament collection with sortable columns.
 * Owned is editable via NumberInput; future PR can persist changes to user DB.
 */
export default function FilamentsTable() {
  const { filaments, updateOwned, softDelete, duplicateFilament } = useFilaments();
  const [sortBy, setSortBy] = useState<SortKey>('title');
  const [reversed, setReversed] = useState(false);
  const [ownedById, setOwnedById] = useState<Record<string, number>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const rows = useMemo(() => {
    const data = filaments.filter((f) => !f.hidden).map((f) => ({ ...f, numSpoolsOwned: ownedById[f.id] ?? f.numSpoolsOwned }));
    const sorted = sortFilaments(data, sortBy, reversed);
    return sorted.map((f) => (
      <Table.Tr key={f.id}>
        <Table.Td>{f.title}</Table.Td>
        <Table.Td>{f.brand}</Table.Td>
        <Table.Td>
          <Group gap={6} wrap="wrap">
            <FilamentBadge colors={f.colors as any} types={f.types as any} />
          </Group>
        </Table.Td>
        <Table.Td>{f.types.join(', ')}</Table.Td>
        <Table.Td>${f.pricePerKilo.toFixed(2)}</Table.Td>
        <Table.Td>
          <NumberInput allowNegative={false} min={0} value={ownedById[f.id] ?? f.numSpoolsOwned} onChange={(val) => setOwnedById((prev) => ({ ...prev, [f.id]: Number(val ?? 0) }))} onBlur={() => { const v = ownedById[f.id]; if (v !== undefined && v !== f.numSpoolsOwned) { updateOwned(f.id, v); } }} />
        </Table.Td>
        <Table.Td>{f.totalUsed.toFixed(2)} kg</Table.Td>
        <Table.Td>
          <Group gap={6}>
            <Tooltip label="Open link">
              <ActionIcon variant="subtle" component="a" href={f.href} target="_blank" rel="noreferrer">
                <IconExternalLink size={16} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Edit">
              <ActionIcon variant="subtle" onClick={() => setEditing(f.id)}>
                <IconPencil size={16} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Duplicate">
              <ActionIcon variant="subtle" onClick={() => duplicateFilament(f.id)}>
                <IconCopy size={16} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Hide filament">
              <ActionIcon color="red" variant="subtle" onClick={() => setPendingDelete(f.id)}>
                <IconTrash size={16} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Table.Td>
      </Table.Tr>
    ));
  }, [sortBy, reversed, ownedById, filaments, updateOwned]);

  const header = (
    <Table.Tr>
      <Table.Th>
        <HeaderSortButton label="Title" sorted={sortBy === 'title'} reversed={reversed} onClick={() => { setReversed(sortBy === 'title' ? !reversed : false); setSortBy('title'); }} />
      </Table.Th>
      <Table.Th>
        <HeaderSortButton label="Brand" sorted={sortBy === 'brand'} reversed={reversed} onClick={() => { setReversed(sortBy === 'brand' ? !reversed : false); setSortBy('brand'); }} />
      </Table.Th>
      <Table.Th>Colors</Table.Th>
      <Table.Th>Types</Table.Th>
      <Table.Th>
        <HeaderSortButton label="Price/kg" sorted={sortBy === 'pricePerKilo'} reversed={reversed} onClick={() => { setReversed(sortBy === 'pricePerKilo' ? !reversed : false); setSortBy('pricePerKilo'); }} />
      </Table.Th>
      <Table.Th>
        <HeaderSortButton label="Owned" sorted={sortBy === 'numSpoolsOwned'} reversed={reversed} onClick={() => { setReversed(sortBy === 'numSpoolsOwned' ? !reversed : false); setSortBy('numSpoolsOwned'); }} />
      </Table.Th>
      <Table.Th>
        <HeaderSortButton label="Used" sorted={sortBy === 'totalUsed'} reversed={reversed} onClick={() => { setReversed(sortBy === 'totalUsed' ? !reversed : false); setSortBy('totalUsed'); }} />
      </Table.Th>
      <Table.Th>ACTIONS</Table.Th>
    </Table.Tr>
  );

  return (
    <Paper withBorder>
      <Modal opened={!!pendingDelete} onClose={() => setPendingDelete(null)} title="Hide filament?" centered>
        <Group justify="flex-end">
          <Button variant="default" onClick={() => setPendingDelete(null)}>Cancel</Button>
          <Button color="red" onClick={() => { if (pendingDelete) { softDelete(pendingDelete); setPendingDelete(null); } }}>Hide</Button>
        </Group>
      </Modal>
      <AddFilamentModal opened={!!editing} onClose={() => setEditing(null)} filament={filaments.find((x) => x.id === editing) || null} />
      <Table striped highlightOnHover>
        <Table.Thead>{header}</Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>
    </Paper>
  );
}


