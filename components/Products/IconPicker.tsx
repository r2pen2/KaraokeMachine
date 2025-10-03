'use client';

import React, { useRef, useState } from 'react';
import { Button, Group, Modal, Stack, Tabs } from '@mantine/core';
import { IconCheck, IconEraser } from '@tabler/icons-react';

type Props = {
  opened: boolean;
  onClose: () => void;
  onSelect: (data: { sketchDataUrl: string }) => void;
};

// Drawing-only mode

export default function IconPicker({ opened, onClose, onSelect }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [strokeColor] = useState<string>('#ffffff');
  const [lineWidth] = useState<number>(3);

  function handleMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) { return; }
    setDrawing(true);
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  }
  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!drawing) { return; }
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) { return; }
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  }
  function handleMouseUp() { setDrawing(false); }
  function clearCanvas() {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx || !canvasRef.current) { return; }
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  }

  function acceptCustom() {
    if (!canvasRef.current) { return; }
    const data = canvasRef.current.toDataURL('image/png');
    onSelect({ sketchDataUrl: data });
    onClose();
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Sketch" centered size="lg">
      <Tabs defaultValue="custom">
        <Tabs.List>
          <Tabs.Tab value="custom">Draw</Tabs.Tab>
        </Tabs.List>
        <Tabs.Panel value="custom" pt="xs">
          <Stack>
            <Group>
              <Button leftSection={<IconEraser size={16} />} variant="light" onClick={clearCanvas}>Clear</Button>
            </Group>
            <div style={{ border: '1px solid #444' }}>
              <canvas
                ref={canvasRef}
                width={256}
                height={256}
                style={{ background: 'transparent', cursor: 'crosshair', width: 256, height: 256 }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              />
            </div>
            <Group justify="flex-end">
              <Button leftSection={<IconCheck size={16} />} onClick={acceptCustom}>Use drawing</Button>
            </Group>
          </Stack>
        </Tabs.Panel>
      </Tabs>
    </Modal>
  );
}


