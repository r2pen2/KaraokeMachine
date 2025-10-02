export type ProductRecord = { id: string; title: string };

// Dummy DB response map keyed by unique product id
const PRODUCTS_BY_ID: Record<string, ProductRecord> = {
  'prod-fidget-star': { id: 'prod-fidget-star', title: 'Fidget Star' },
  'prod-lamp': { id: 'prod-lamp', title: 'Lamp' },
};

export function getAllProducts(): ProductRecord[] {
  return Object.values(PRODUCTS_BY_ID).sort((a, b) => a.title.localeCompare(b.title));
}


