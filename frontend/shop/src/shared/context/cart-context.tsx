'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ProductInventoryItem } from '@/shared/types';

export type CartItem = {
  id: number;
  name: string;
  brandName: string;
  price: number;
  quantity: number;
  stockQuantity?: number;
};

type CartContextValue = {
  items: CartItem[];
  addToCart: (product: ProductInventoryItem, quantity?: number) => void;
  updateQuantity: (id: number, quantity: number, stockLimit?: number) => void;
  removeFromCart: (id: number) => void;
  clearCart: () => void;
  total: number;
  checkout: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = 'shop.cart';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        setItems(JSON.parse(raw));
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const total = useMemo(
    () =>
      items.reduce((sum, item) => {
        return sum + item.quantity * item.price;
      }, 0),
    [items]
  );

  const value: CartContextValue = {
    items,
    addToCart: (product, quantity = 1) => {
      setItems((prev) => {
        const existing = prev.find((item) => item.id === product.id);
        const max = product.stockQuantity ?? Infinity;
        if (existing) {
          const nextQty = Math.min(existing.quantity + quantity, max);
          return prev.map((item) =>
            item.id === product.id ? { ...item, quantity: nextQty, stockQuantity: max } : item
          );
        }

        return [
          ...prev,
          {
            id: product.id,
            name: product.name,
            brandName: product.brandName,
            price: Number(product.price),
            quantity: Math.min(quantity, max),
            stockQuantity: max,
          },
        ];
      });
    },
    updateQuantity: (id, quantity, stockLimit) => {
      setItems((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                quantity: Math.max(1, Math.min(quantity, stockLimit ?? item.stockQuantity ?? Infinity)),
              }
            : item
        )
      );
    },
    removeFromCart: (id) => {
      setItems((prev) => prev.filter((item) => item.id !== id));
    },
    clearCart: () => setItems([]),
    total,
    checkout: async () => {
      setItems([]);
    },
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error('useCart must be used inside CartProvider');
  }
  return ctx;
}
