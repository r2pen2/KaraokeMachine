export type OrderPiece = {
  productId: string;
  productTitle: string;
  quantity: number; // multiplier for this product instance
  price?: number; // per-product price (per unit)
  parts: Array<{
    label: string;
    requiredWeightGrams: number;
    selectedFilamentId?: string; // chosen from user's filaments
    priceOverride?: number; // deprecated: per-part price; prefer OrderPiece.price
  }>;
};

export type OrderTotalsByFilament = Record<string, {
  totalWeightGrams: number;
  totalPrice: number;
}>;

export type OrderStatus = 'Not Started' | 'Printing' | 'Printed' | 'Done';

export type Order = {
  id: string;
  title: string;
  dueDate: string | null; // ISO string
  ownerUid: string;
  hidden: boolean;
  status: OrderStatus;
  pieces: OrderPiece[];
  totalsByFilament: OrderTotalsByFilament;
  revenue: number;
  expenses: number;
  profit: number; // revenue - expenses
  printedCounts: Record<number, number>; // pieceIndex -> count printed
};


