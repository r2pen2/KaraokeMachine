'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActionIcon, Button, Group, Modal, NumberInput, Stack, TextInput, Tooltip, Tabs, Divider } from '@mantine/core';
import { IconPlus, IconTrash, IconEraser } from '@tabler/icons-react';
import { useProducts } from '../../context/ProductsContext';
import type { Product, ProductFilamentRequirement } from '../../lib/db/models/product';

type Props = {
  opened: boolean;
  onClose: () => void;
  product?: Product;
};

export default function AddProductModal({ opened, onClose, product }: Props) {
  const { createProduct, updateProduct } = useProducts();

  const [title, setTitle] = useState('');
  const [printTimeHours, setPrintTimeHours] = useState<number | ''>('');
  const [filaments, setFilaments] = useState<ProductFilamentRequirement[]>([]);
  const [priceMode, setPriceMode] = useState<'single' | 'custom'>('single');
  const [singlePrice, setSinglePrice] = useState<number | ''>('');
  const [customPrices, setCustomPrices] = useState<Array<{ key: string; price: number | '' }>>([]);
  const sketchCanvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);

  // Initialize form when editing
  useEffect(() => {
    if (product && opened) {
      setTitle(product.title);
      setPrintTimeHours(product.printTimeHours || '');
      setFilaments(product.filaments || []);
      if (typeof product.prices === 'number') {
        setPriceMode('single');
        setSinglePrice(product.prices);
        setCustomPrices([]);
      } else {
        setPriceMode('custom');
        setSinglePrice('');
        setCustomPrices(Object.entries(product.prices).map(([key, price]) => ({ key, price })));
      }
      // Load sketch if exists
      if (product.sketchDataUrl && sketchCanvasRef.current) {
        const img = new Image();
        img.onload = () => {
          const ctx = sketchCanvasRef.current?.getContext('2d');
          if (ctx) {
            ctx.clearRect(0, 0, 256, 256);
            ctx.drawImage(img, 0, 0);
          }
        };
        img.src = product.sketchDataUrl;
      }
    } else if (!opened) {
      // Reset form when modal closes (but only if not editing)
      if (!product) {
        setTitle('');
        setPrintTimeHours('');
        setFilaments([]);
        setPriceMode('single');
        setSinglePrice('');
        setCustomPrices([]);
        const ctx = sketchCanvasRef.current?.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, 256, 256);
        }
      }
    }
  }, [product, opened]);

  const canSubmit = useMemo(() => {
    const hasTitle = title.trim().length > 0;
    const hasPrice = priceMode === 'single' ? singlePrice !== '' : customPrices.every((p) => p.key.trim().length > 0 && p.price !== '');
    return hasTitle && hasPrice;
  }, [title, priceMode, singlePrice, customPrices]);

  function addFilamentRow() {
    setFilaments((prev) => [...prev, { label: '', description: '', weightGrams: 0 }]);
  }

  function updateFilamentRow(idx: number, patch: Partial<ProductFilamentRequirement>) {
    setFilaments((prev) => prev.map((f, i) => (i === idx ? { ...f, ...patch } : f)));
  }

  function removeFilamentRow(idx: number) {
    setFilaments((prev) => prev.filter((_, i) => i !== idx));
  }

  function addCustomPrice() {
    setCustomPrices((prev) => [...prev, { key: '', price: '' }]);
  }

  function updateCustomPrice(i: number, patch: Partial<{ key: string; price: number | '' }>) {
    setCustomPrices((prev) => prev.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));
  }

  function removeCustomPrice(i: number) {
    setCustomPrices((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSubmit() {
    if (!canSubmit) { return; }
    const prices = priceMode === 'single'
      ? Number(singlePrice || 0)
      : Object.fromEntries(customPrices.map((p) => [p.key.trim(), Number(p.price || 0)]));
    const sketchDataUrl = sketchCanvasRef.current ? sketchCanvasRef.current.toDataURL('image/png') : undefined;
    const payloadBase: any = {
      title: title.trim(),
      printTimeHours: Number(printTimeHours || 0),
      filaments: filaments.map((f) => ({
        label: f.label.trim(),
        weightGrams: Number(f.weightGrams || 0),
        ...(f.description && f.description.trim().length > 0 ? { description: f.description.trim() } : {}),
      })),
      prices,
      ...(sketchDataUrl ? { sketchDataUrl } : {}),
      ownerUid: '', // set in context
      hidden: false, // set in context
    } as Omit<Product, 'id'>;
    
    if (product) {
      // Editing existing product
      await updateProduct(product.id, payloadBase);
    } else {
      // Creating new product
      await createProduct(payloadBase);
    }
    onClose();
  }

  function startDraw(e: React.MouseEvent<HTMLCanvasElement>) {
    const ctx = sketchCanvasRef.current?.getContext('2d');
    if (!ctx) { return; }
    setDrawing(true);
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  }
  function moveDraw(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!drawing) { return; }
    const ctx = sketchCanvasRef.current?.getContext('2d');
    if (!ctx) { return; }
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  }
  function endDraw() { setDrawing(false); }
  function clearSketch() {
    const ctx = sketchCanvasRef.current?.getContext('2d');
    if (!ctx || !sketchCanvasRef.current) { return; }
    ctx.clearRect(0, 0, sketchCanvasRef.current.width, sketchCanvasRef.current.height);
  }

  return (
    <Modal opened={opened} onClose={onClose} title={product ? "Edit product" : "Add product"} centered>
      <Stack>
        <TextInput label="Title" placeholder="e.g., Fidget Star" value={title} onChange={(e) => setTitle(e.currentTarget.value)} />
        <NumberInput label="Print time (hours)" min={0} value={printTimeHours} onChange={(v) => setPrintTimeHours(typeof v === 'number' ? v : (v === '' ? '' : Number(v)))} />

        <Divider />
        <Stack align="center">
          <Group justify="space-between" style={{ width: '100%' }}>
            <div>Sketch</div>
            <Button size="xs" variant="light" leftSection={<IconEraser size={14} />} onClick={clearSketch}>Clear</Button>
          </Group>
          <div style={{ border: '1px solid #444', width: 256, height: 256 }}>
            <canvas
              ref={sketchCanvasRef}
              width={256}
              height={256}
              style={{ background: 'transparent', cursor: 'crosshair', width: 256, height: 256 }}
              onMouseDown={startDraw}
              onMouseMove={moveDraw}
              onMouseUp={endDraw}
              onMouseLeave={endDraw}
            />
          </div>
        </Stack>
        <Divider />
        <Group justify="space-between">
          <div>Filament requirements</div>
          <Button size="xs" leftSection={<IconPlus size={14} />} onClick={addFilamentRow}>Add filament</Button>
        </Group>
        <Stack>
          {filaments.map((f, i) => (
                <Group key={i} align="flex-end">
                  <TextInput label="Label" w={160} value={f.label} onChange={(e) => updateFilamentRow(i, { label: e.currentTarget.value })} />
                  <NumberInput label="Weight (g)" min={0} w={160} value={f.weightGrams} onChange={(v) => {
                    const num = typeof v === 'number' ? v : (v === '' ? 0 : Number(v));
                    updateFilamentRow(i, { weightGrams: num });
                  }} />
                  <Tooltip label="Remove">
                    <ActionIcon color="red" variant="subtle" onClick={() => removeFilamentRow(i)}>
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
          ))}
        </Stack>

        <Tabs value={priceMode} onChange={(v) => setPriceMode((v as any) || 'single')}>
          <Tabs.List>
            <Tabs.Tab value="single">Single price</Tabs.Tab>
            <Tabs.Tab value="custom">Custom prices</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="single" pt="xs">
            <NumberInput label="Price (USD)" min={0} value={singlePrice} onChange={(v) => setSinglePrice(typeof v === 'number' ? v : (v === '' ? '' : Number(v)))} />
          </Tabs.Panel>
          <Tabs.Panel value="custom" pt="xs">
            <Group justify="space-between">
              <div>Price entries</div>
              <Button size="xs" leftSection={<IconPlus size={14} />} onClick={addCustomPrice}>Add price</Button>
            </Group>
            <Stack>
              {customPrices.map((p, i) => (
                <Group key={i} align="flex-end">
                  <TextInput label="Key" w={160} value={p.key} onChange={(e) => updateCustomPrice(i, { key: e.currentTarget.value })} />
                  <NumberInput label="Price (USD)" min={0} w={160} value={p.price} onChange={(v) => updateCustomPrice(i, { price: typeof v === 'number' ? v : (v === '' ? '' : Number(v)) })} />
                  <Tooltip label="Remove">
                    <ActionIcon color="red" variant="subtle" onClick={() => removeCustomPrice(i)}>
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              ))}
            </Stack>
          </Tabs.Panel>
        </Tabs>

        <Group justify="flex-end" mt="md">
          <Button onClick={handleSubmit} disabled={!canSubmit}>Create</Button>
        </Group>
      </Stack>
    </Modal>
  );
}


