import { create } from 'zustand';

export type CartItemModifier = {
  modifierGroupName: string;
  modifierOptionName: string;
  priceDelta: number;
};

export type CartItem = {
  cartItemId: string;
  productId: number;
  productName: string;
  unitPrice: number;
  costPrice: number;
  qty: number;
  note: string;
  modifiers: CartItemModifier[];
};

type CartState = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'cartItemId'>) => void;
  removeItem: (cartItemId: string) => void;
  updateQty: (cartItemId: string, qty: number) => void;
  clear: () => void;
};

export const useCartStore = create<CartState>((set) => ({
  items: [],
  addItem: (item) =>
    set((state) => ({
      items: [...state.items, { ...item, cartItemId: `${Date.now()}-${Math.random().toString(36).slice(2)}` }],
    })),
  removeItem: (cartItemId) =>
    set((state) => ({ items: state.items.filter((item) => item.cartItemId !== cartItemId) })),
  updateQty: (cartItemId, qty) =>
    set((state) => ({
      items: state.items
        .map((item) => (item.cartItemId === cartItemId ? { ...item, qty } : item))
        .filter((item) => item.qty > 0),
    })),
  clear: () => set({ items: [] }),
}));

export function cartItemTotal(item: CartItem): number {
  const modifiersTotal = item.modifiers.reduce((sum, modifier) => sum + modifier.priceDelta, 0);
  return (item.unitPrice + modifiersTotal) * item.qty;
}

export function cartSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + cartItemTotal(item), 0);
}
