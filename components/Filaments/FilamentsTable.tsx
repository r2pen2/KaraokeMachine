'use client';

import React, { useMemo, useState } from 'react';
import { Badge, Center, Group, NumberInput, Paper, Table, Text, UnstyledButton } from '@mantine/core';
import { buildTightLinearGradient, pickBadgeTextColor } from '../../lib/color';
import { useFilaments } from '../../context/FilamentsContext';
import { Filament, SpecialColor } from '../../lib/db/models/filament';
import { IconChevronDown, IconChevronUp, IconSelector } from '@tabler/icons-react';

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

function ColorBadge({ colors, types }: { colors: Filament['colors']; types: Filament['types'] }) {
  if (colors.length === 0) { return null; }
  const isRainbow = colors.includes(SpecialColor.Rainbow);
  const baseStyle: React.CSSProperties = { width: 120, paddingInline: 12, border: 'none', outline: 'none', boxShadow: 'none' };
  if (isRainbow) {
    baseStyle.background = 'linear-gradient(90deg, red 0%, orange 16.66%, yellow 33.33%, green 50%, blue 66.66%, indigo 83.33%, violet 100%)';
  } else if (colors.length === 1) {
    baseStyle.backgroundColor = colors[0] as string;
  } else {
    baseStyle.background = buildTightLinearGradient(colors as string[]);
  }
  // Silk effect: subtle glow border
  if (types.includes('silk')) {
    baseStyle.boxShadow = '0 0 6px 2px rgba(255,255,255,0.6), 0 0 12px rgba(255,255,255,0.35)';
    baseStyle.border = '1px solid rgba(255,255,255,0.85)';
  }
  // Matte effect: single horizontal strike-through line centered
  if (types.includes('matte')) {
    const base = baseStyle.background ? String(baseStyle.background) : `linear-gradient(0deg, ${String(baseStyle.backgroundColor)}, ${String(baseStyle.backgroundColor)})`;
    const seed = isRainbow ? '#ff0000' : (colors[0] as string);
    const textColor = pickBadgeTextColor(seed);
    const isDarkBg = textColor === 'white';
    const lineColor = isDarkBg ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.20)';
    const thickness = '0.14rem';
    // Line layer first (on top), base layer second; centered; no repeat
    baseStyle.backgroundImage = `linear-gradient(to bottom, transparent 0, transparent calc(50% - ${thickness}), ${lineColor} calc(50% - ${thickness}), ${lineColor} calc(50% + ${thickness}), transparent calc(50% + ${thickness}), transparent 100%), ${base}`;
    baseStyle.backgroundSize = `auto, auto`;
    baseStyle.backgroundPosition = 'center, center';
    baseStyle.backgroundRepeat = 'no-repeat, no-repeat';
    delete (baseStyle as any).background;
    delete (baseStyle as any).backgroundColor;
  }
  return <Badge variant="filled" style={baseStyle} />;
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
  const { filaments, updateOwned } = useFilaments();
  const [sortBy, setSortBy] = useState<SortKey>('title');
  const [reversed, setReversed] = useState(false);
  const [ownedById, setOwnedById] = useState<Record<string, number>>({});

  const rows = useMemo(() => {
    const data = filaments.map((f) => ({ ...f, numSpoolsOwned: ownedById[f.id] ?? f.numSpoolsOwned }));
    const sorted = sortFilaments(data, sortBy, reversed);
    return sorted.map((f) => (
      <Table.Tr key={f.id}>
        <Table.Td>{f.title}</Table.Td>
        <Table.Td>{f.brand}</Table.Td>
        <Table.Td>
          <Group gap={6} wrap="wrap">
            <ColorBadge colors={f.colors} types={f.types} />
          </Group>
        </Table.Td>
        <Table.Td>{f.types.join(', ')}</Table.Td>
        <Table.Td>${f.pricePerKilo.toFixed(2)}</Table.Td>
        <Table.Td>
          <NumberInput allowNegative={false} min={0} value={ownedById[f.id] ?? f.numSpoolsOwned} onChange={(val) => setOwnedById((prev) => ({ ...prev, [f.id]: Number(val ?? 0) }))} onBlur={() => { const v = ownedById[f.id]; if (v !== undefined && v !== f.numSpoolsOwned) { updateOwned(f.id, v); } }} />
        </Table.Td>
        <Table.Td>{f.totalUsed.toFixed(2)} kg</Table.Td>
        <Table.Td>
          <Text component="a" href={f.href} target="_blank" rel="noreferrer" c="blue.6">
            Link
          </Text>
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
      <Table.Th>Store</Table.Th>
    </Table.Tr>
  );

  return (
    <Paper withBorder>
      <Table striped highlightOnHover>
        <Table.Thead>{header}</Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>
    </Paper>
  );
}


