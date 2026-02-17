'use client';

import { useMemo, useState } from 'react';
import { ProductGrid } from './product-grid';
import { Input } from '@/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import type { ProductInventoryItem } from '@/shared/types';

type Props = {
  products: ProductInventoryItem[];
};

export default function CatalogFilters({ products }: Props) {
  const [search, setSearch] = useState('');
  const [brand, setBrand] = useState<'all' | string>('all');

  const brands = useMemo(
    () => Array.from(new Set(products.map((p) => p.brandName).filter(Boolean))),
    [products]
  );

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesBrand = brand === 'all' || p.brandName === brand;
      const haystack = `${p.name} ${p.description ?? ''} ${p.brandName ?? ''}`.toLowerCase();
      const matchesSearch = haystack.includes(search.trim().toLowerCase());
      return matchesBrand && matchesSearch;
    });
  }, [products, brand, search]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <Input
          placeholder="Поиск по названию или описанию"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="md:max-w-sm"
        />
        <Select value={brand} onValueChange={(val) => setBrand(val)}>
          <SelectTrigger className="w-full md:w-64">
            <SelectValue placeholder="Бренд" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все бренды</SelectItem>
            {brands.map((b) => (
              <SelectItem key={b} value={b}>
                {b}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ProductGrid
        products={filtered}
        emptyMessage="Здесь появятся товары, как только админы их добавят."
        maxCols="sm:grid-cols-2 lg:grid-cols-3"
      />
    </div>
  );
}
