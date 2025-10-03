'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Button, Group, Paper } from '@mantine/core';
import { IconCheck, IconEraser } from '@tabler/icons-react';
import { useProducts } from '../../context/ProductsContext';

export default function SketchPad() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const { products, updateProduct } = useProducts();
  const product = products[0] || null;

  useEffect(() => {
    if (!product?.sketchDataUrl || !canvasRef.current) { return; }
    const img = new Image();
    img.onload = () => {
      const ctx = canvasRef.current!.getContext('2d');
      if (!ctx) { return; }
      ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
      ctx.drawImage(img, 0, 0, canvasRef.current!.width, canvasRef.current!.height);
    };
    img.src = product.sketchDataUrl;
  }, [product?.sketchDataUrl]);

  function start(e: React.MouseEvent<HTMLCanvasElement>) {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) { return; }
    setDrawing(true);
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  }
  function move(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!drawing) { return; }
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) { return; }
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  }
  function end() { setDrawing(false); }

  function clearCanvas() {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx || !canvasRef.current) { return; }
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  }

  async function save() {
    if (!canvasRef.current || !product) { return; }
    const data = canvasRef.current.toDataURL('image/png');
    await updateProduct(product.id, { sketchDataUrl: data });
  }

  return (
    <Paper withBorder p="sm">
      <Group justify="space-between" mb="xs">
        <div>Sketch</div>
        <Group>
          <Button size="xs" variant="light" leftSection={<IconEraser size={14} />} onClick={clearCanvas}>Clear</Button>
          <Button size="xs" leftSection={<IconCheck size={14} />} onClick={save} disabled={!product}>Save</Button>
        </Group>
      </Group>
      <div style={{ border: '1px solid #444', width: 256, height: 256 }}>
        <canvas
          ref={canvasRef}
          width={256}
          height={256}
          style={{ background: 'transparent', cursor: 'crosshair', width: 256, height: 256 }}
          onMouseDown={start}
          onMouseMove={move}
          onMouseUp={end}
          onMouseLeave={end}
        />
      </div>
    </Paper>
  );
}


