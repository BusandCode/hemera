import { createContext, useContext, useMemo, useState, ReactNode } from 'react';
import { MenuItem } from '../constants/foodData';

export type CartLine = {
  item: MenuItem;
  qty: number;
};

type CartContextValue = {
  lines: CartLine[];
  addItem: (item: MenuItem, qty?: number) => void;
  removeItem: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  itemCount: number;
  total: number;
  quantityOf: (id: string) => number;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);

  const addItem = (item: MenuItem, qty = 1) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.item.id === item.id);
      if (existing) {
        return prev.map((l) =>
          l.item.id === item.id ? { ...l, qty: l.qty + qty } : l
        );
      }
      return [...prev, { item, qty }];
    });
  };

  const removeItem = (id: string) => {
    setLines((prev) => prev.filter((l) => l.item.id !== id));
  };

  const setQty = (id: string, qty: number) => {
    if (qty <= 0) {
      removeItem(id);
      return;
    }
    setLines((prev) =>
      prev.map((l) => (l.item.id === id ? { ...l, qty } : l))
    );
  };

  const clear = () => setLines([]);

  const quantityOf = (id: string) =>
    lines.find((l) => l.item.id === id)?.qty ?? 0;

  const value = useMemo<CartContextValue>(() => {
    const itemCount = lines.reduce((sum, l) => sum + l.qty, 0);
    const total = lines.reduce((sum, l) => sum + l.qty * l.item.price, 0);
    return { lines, addItem, removeItem, setQty, clear, itemCount, total, quantityOf };
  }, [lines]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used inside a CartProvider');
  }
  return ctx;
}