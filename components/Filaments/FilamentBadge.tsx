'use client';

import React from 'react';
import { Badge } from '@mantine/core';
import { buildTightLinearGradient, pickBadgeTextColor } from '../../lib/color';
import type { FilamentType, HexColor, SpecialColor } from '../../lib/db/models/filament';

type Props = {
  colors: Array<HexColor | SpecialColor>;
  types: FilamentType[];
  width?: number; // px
  heightPx?: number; // px
};

export default function FilamentBadge({ colors, types, width = 120, heightPx }: Props) {
  if (!colors || colors.length === 0) { return null; }
  const isRainbow = colors.includes('rainbow' as SpecialColor);
  const style: React.CSSProperties = { width, paddingInline: Math.min(12, Math.max(4, Math.floor(width / 6))), border: 'none', outline: 'none', boxShadow: 'none', height: heightPx };

  if (isRainbow) {
    style.background = 'linear-gradient(90deg, red 0%, orange 16.66%, yellow 33.33%, green 50%, blue 66.66%, indigo 83.33%, violet 100%)';
  } else if (colors.length === 1) {
    style.backgroundColor = colors[0] as string;
  } else {
    style.background = buildTightLinearGradient(colors as string[]);
  }

  if (types.includes('silk')) {
    style.boxShadow = '0 0 6px 2px rgba(255,255,255,0.6), 0 0 12px rgba(255,255,255,0.35)';
    style.border = '1px solid rgba(255,255,255,0.85)';
  }

  if (types.includes('matte')) {
    const base = style.background ? String(style.background) : `linear-gradient(0deg, ${String(style.backgroundColor)}, ${String(style.backgroundColor)})`;
    const seed = isRainbow ? '#ff0000' : (colors[0] as string);
    const textColor = pickBadgeTextColor(seed);
    const isDarkBg = textColor === 'white';
    const lineColor = isDarkBg ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.20)';
    const thickness = '0.14rem';
    style.backgroundImage = `linear-gradient(to bottom, transparent 0, transparent calc(50% - ${thickness}), ${lineColor} calc(50% - ${thickness}), ${lineColor} calc(50% + ${thickness}), transparent calc(50% + ${thickness}), transparent 100%), ${base}`;
    style.backgroundSize = `auto, auto`;
    style.backgroundPosition = 'center, center';
    style.backgroundRepeat = 'no-repeat, no-repeat';
    delete (style as any).background;
    delete (style as any).backgroundColor;
  }

  return <Badge variant="filled" style={style} />;
}


