'use client';

import React, { useMemo, useState } from 'react';
import { ActionIcon, Autocomplete, Badge, Button, ColorPicker, Group, Modal, NumberInput, Stack, TagsInput, TextInput, Tooltip, Tabs, Select } from '@mantine/core';
import { IconPlus, IconX } from '@tabler/icons-react';
import { useFilaments } from '../../context/FilamentsContext';
import type { Filament, FilamentType, HexColor, SpecialColor } from '../../lib/db/models/filament';
import { pickBadgeTextColor } from '../../lib/color';

const COMMON_BRANDS = ['Prusament', 'eSun', 'Hatchbox', 'Overture', 'SUNLU', 'GizmoDorks', 'Generic'];
const ALL_TYPES: FilamentType[] = ['normal', 'silk', 'matte', 'speed', 'multicolor'];

type Props = {
  opened: boolean;
  onClose: () => void;
};

export default function AddFilamentModal({ opened, onClose }: Props) {
  const { createFilament } = useFilaments();

  const [title, setTitle] = useState('');
  const [brand, setBrand] = useState('');
  const [href, setHref] = useState('');
  const [pricePerKilo, setPricePerKilo] = useState<number | ''>('');
  const [numSpoolsOwned, setNumSpoolsOwned] = useState<number | ''>('');
  const [totalUsed, setTotalUsed] = useState<number | ''>('');
  const [types, setTypes] = useState<FilamentType[]>(['normal']);

  const [colorMode, setColorMode] = useState<'single' | 'multi' | 'special'>('single');
  const [currentColor, setCurrentColor] = useState<HexColor>('#000000');
  const [colors, setColors] = useState<HexColor[]>(['#000000']);
  const [special, setSpecial] = useState<SpecialColor | ''>('');

  const canSubmit = useMemo(() => {
    const hasColors = colorMode === 'special' ? special !== '' : colors.length > 0;
    return title.trim().length > 0 && brand.trim().length > 0 && hasColors && pricePerKilo !== '';
  }, [title, brand, colors, special, colorMode, pricePerKilo]);

  function addColor() {
    setColors((prev) => (prev.includes(currentColor) ? prev : [...prev, currentColor]));
  }
  function removeColor(c: HexColor) {
    setColors((prev) => prev.filter((x) => x !== c));
  }

  function handleNumberChange(setter: React.Dispatch<React.SetStateAction<number | ''>>) {
    return (v: string | number) => {
      if (v === '') { setter(''); return; }
      if (typeof v === 'number') { setter(v); return; }
      const n = parseFloat(v);
      setter(Number.isNaN(n) ? '' : n);
    };
  }

  async function handleSubmit() {
    if (!canSubmit) { return; }
    const payload: Omit<Filament, 'id'> = {
      title: title.trim(),
      brand: brand.trim(),
      href: href.trim(),
      colors: colorMode === 'special' && special ? [special] as any : colors,
      types,
      pricePerKilo: Number(pricePerKilo || 0),
      numSpoolsOwned: Number(numSpoolsOwned || 0),
      totalUsed: Number(totalUsed || 0),
    };
    await createFilament(payload);
    onClose();
    // reset
    setTitle('');
    setBrand('');
    setHref('');
    setPricePerKilo('');
    setNumSpoolsOwned('');
    setTotalUsed('');
    setTypes([]);
    setColorMode('single');
    setCurrentColor('#000000');
    setColors(['#000000']);
    setSpecial('');
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Add filament" centered>
      <Stack>
        <TextInput label="Title" placeholder="e.g., Silk Gold PLA" value={title} onChange={(e) => setTitle(e.currentTarget.value)} />
        <Autocomplete label="Brand" placeholder="Start typing…" data={COMMON_BRANDS} value={brand} onChange={setBrand} />
        <TextInput label="Store link" placeholder="https://…" value={href} onChange={(e) => setHref(e.currentTarget.value)} />
        <Group grow>
          <NumberInput label="Price per kilo (USD)" min={0} value={pricePerKilo} onChange={handleNumberChange(setPricePerKilo)} />
          <NumberInput label="Owned (spools)" min={0} value={numSpoolsOwned} onChange={handleNumberChange(setNumSpoolsOwned)} />
          <NumberInput label="Total used (kg)" min={0} value={totalUsed} onChange={handleNumberChange(setTotalUsed)} />
        </Group>

        <Tabs value={colorMode} onChange={(v) => setColorMode((v as any) || 'single')}>
          <Tabs.List>
            <Tabs.Tab value="single">Single Color</Tabs.Tab>
            <Tabs.Tab value="multi">Multicolor</Tabs.Tab>
            <Tabs.Tab value="special">Special</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="single" pt="xs">
            <Stack gap="xs">
              <ColorPicker format="hex" value={currentColor} onChange={(v) => { setCurrentColor(v as HexColor); setColors([v as HexColor]); }} fullWidth />
              <Badge style={{ background: currentColor, color: pickBadgeTextColor(currentColor) }}>{currentColor}</Badge>
            </Stack>
          </Tabs.Panel>
          <Tabs.Panel value="multi" pt="xs">
            <Stack gap="xs">
              <ColorPicker format="hex" value={currentColor} onChange={(v) => setCurrentColor(v as HexColor)} fullWidth />
              <Group>
                <Button leftSection={<IconPlus size={16} />} onClick={addColor}>Add color</Button>
                <Group gap={6} wrap="wrap">
                  {colors.map((c) => (
                    <Badge key={c} style={{ background: c, color: pickBadgeTextColor(c) }} rightSection={
                      <Tooltip label="Remove">
                        <ActionIcon size="xs" variant="subtle" onClick={() => removeColor(c)}>
                          <IconX size={12} />
                        </ActionIcon>
                      </Tooltip>
                    }>
                      {c}
                    </Badge>
                  ))}
                </Group>
              </Group>
            </Stack>
          </Tabs.Panel>
          <Tabs.Panel value="special" pt="xs">
            <Select label="Special color" data={[{ value: 'rainbow', label: 'Rainbow' }]} value={special} onChange={(v) => setSpecial((v as SpecialColor) || '')} placeholder="Pick special color" />
          </Tabs.Panel>
        </Tabs>

        <TagsInput label="Types" placeholder="Select types" data={ALL_TYPES} value={types} onChange={(vals) => setTypes(vals as FilamentType[])} />

        <Group justify="flex-end" mt="md">
          <Button onClick={handleSubmit} disabled={!canSubmit}>Create</Button>
        </Group>
      </Stack>
    </Modal>
  );
}


