import { fetchCatalog } from "@/shared/api/catalog";
import { Button } from "@/shared/ui/button";
import { ProductGrid } from "@/components/catalog/product-grid";
import CatalogFilters from "@/components/catalog/catalog-filters";

export const metadata = {
  title: "Каталог — Chairly Shop",
};

export default async function CatalogPage() {
  const products = await fetchCatalog();

  return (
    <div className="container space-y-8 px-4 py-10 mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
            Каталог
          </p>
          <h1 className="text-3xl font-semibold">Весь ассортимент</h1>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <a href="/cart">Перейти к корзине</a>
        </Button>
      </div>

      <CatalogFilters products={products} />
    </div>
  );
}
