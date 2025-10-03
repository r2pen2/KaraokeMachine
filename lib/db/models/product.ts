export type ProductFilamentRequirement = {
  label: string;
  description?: string;
  weightGrams: number;
  previewColors?: Array<HexColor | SpecialColor>;
  previewTypes?: FilamentType[];
};

export type ProductPriceMap = Record<string, number> | number;

export type Product = {
  id: string;
  title: string;
  sketchDataUrl?: string; // user drawn icon placed under title on homepage
  printTimeHours: number;
  filaments: ProductFilamentRequirement[];
  prices: ProductPriceMap; // number for single price, or keyed map for sizes
  ownerUid: string;
  hidden: boolean;
};


