'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { ProductInventoryItem } from '@/shared/types';

type FavoriteItem = ProductInventoryItem;

type FavoritesContextValue = {
  favorites: FavoriteItem[];
  addFavorite: (item: FavoriteItem) => void;
  removeFavorite: (id: number) => void;
  toggleFavorite: (item: FavoriteItem) => void;
  isFavorite: (id: number) => boolean;
};

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

const STORAGE_KEY = 'shop.favorites';

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        setFavorites(JSON.parse(raw));
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
  }, [favorites]);

  const value = useMemo<FavoritesContextValue>(
    () => ({
      favorites,
      addFavorite: (item) => {
        setFavorites((prev) => (prev.some((fav) => fav.id === item.id) ? prev : [...prev, item]));
      },
      removeFavorite: (id) => {
        setFavorites((prev) => prev.filter((fav) => fav.id !== id));
      },
      toggleFavorite: (item) => {
        setFavorites((prev) =>
          prev.some((fav) => fav.id === item.id)
            ? prev.filter((fav) => fav.id !== item.id)
            : [...prev, item]
        );
      },
      isFavorite: (id) => favorites.some((fav) => fav.id === id),
    }),
    [favorites]
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) {
    throw new Error('useFavorites must be used inside FavoritesProvider');
  }
  return ctx;
}
