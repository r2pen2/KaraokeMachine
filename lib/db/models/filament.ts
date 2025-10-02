export enum SpecialColor {
  Rainbow = 'rainbow',
}

export type HexColor = `#${string}`;

export type FilamentType = 'normal' | 'multicolor' | 'silk' | 'matte' | 'speed';

/**
 * Describes a filament available to the user.
 * - colors: one or more hex colors or a special color (e.g. rainbow)
 * - types: categorical attributes of the filament
 * - pricePerKilo: price in USD per kilogram
 * - numSpoolsOwned: current inventory of spools owned by the user
 * - totalUsed: cumulative kilograms used across prints (for sorting/analytics)
 */
export type Filament = {
  id: string;
  title: string;
  brand: string;
  colors: Array<HexColor | SpecialColor>;
  types: FilamentType[];
  href: string;
  pricePerKilo: number;
  numSpoolsOwned: number;
  totalUsed: number;
  /** Optional owner uid for access control */
  ownerUid?: string;
};


