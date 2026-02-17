import { fetchCatalog } from "@/shared/api/catalog";
import { fetchBrandAnalytics } from "@/shared/api/analytics";
import { BrandSalesAnalytics, ProductInventoryItem } from "@/shared/types";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import Image from "next/image";
import { ProductGrid } from "@/components/catalog/product-grid";
import { HeroActions } from "@/components/hero/hero-actions";

export default async function HomePage() {
  const [catalog, brandAnalytics] = await Promise.all([
    fetchCatalog(),
    fetchBrandAnalytics(),
  ]);
  const heroProduct = catalog[0];
  const otherProducts = catalog.slice(1, 7);
  const spotlightBrands = brandAnalytics.slice(0, 3);

  return (
    <div className="space-y-16">
      <Hero product={heroProduct} />
      <FeaturedGrid products={otherProducts} />
      <BrandSpotlight brands={spotlightBrands} />
      <AboutSection />
    </div>
  );
}

function Hero({ product }: { product?: ProductInventoryItem }) {
  return (
    <section className="bg-muted/50">
      <div className="container grid gap-8 px-4 py-16 mx-auto md:grid-cols-2">
        <div className="space-y-6">
          <p className="uppercase text-sm tracking-[0.3em] text-muted-foreground">
            Новая коллекция · 2025
          </p>
          <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
            Эргономичные стулья для тех, кто ценит комфорт
          </h1>
          <p className="text-muted-foreground">
            Подберите идеальный стул для работы, отдыха и вдохновения.
          </p>
          <HeroActions />
        </div>
        <div className="relative h-72 overflow-hidden rounded-2xl bg-white shadow-md md:h-auto">
          {product ? (
            <Image
              src={product.imageUrl ?? "/placeholder.svg"}
              alt={product.name}
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              Пополняем витрину...
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function FeaturedGrid({ products }: { products: ProductInventoryItem[] }) {
  return (
    <section id="catalog" className="container space-y-6 px-4 mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
            Каталог
          </p>
          <h2 className="text-3xl font-semibold">Популярные модели</h2>
        </div>
        <Button variant="ghost" asChild className="w-full sm:w-auto">
          <a href="/catalog">Открыть все</a>
        </Button>
      </div>
      <ProductGrid
        products={products}
        emptyMessage="Каталог пока пуст. Добавьте товары в админ-панели."
      />
    </section>
  );
}

function BrandSpotlight({ brands }: { brands: BrandSalesAnalytics[] }) {
  if (!brands.length) return null;

  return (
    <section className="bg-background py-16 border-y">
      <div className="container space-y-6 px-4 mx-auto">
        <div className="flex flex-col gap-2 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
            Продажи по брендам
          </p>
          <h2 className="text-3xl font-semibold">Лидеры этого месяца</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {brands.map((brand) => (
            <Card key={brand.brandId} className="bg-muted/20">
              <CardHeader>
                <CardTitle>{brand.brand}</CardTitle>
                <CardDescription>
                  {brand.orders} заказов · {brand.deliveredOrders} доставлено
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-2xl font-semibold">
                  {brand.revenue.toLocaleString("ru-RU", {
                    style: "currency",
                    currency: "RUB",
                    maximumFractionDigits: 0,
                  })}
                </p>
                <p className="text-sm text-muted-foreground">
                  Средний чек {brand.averageOrderValue.toLocaleString("ru-RU", {
                    style: "currency",
                    currency: "RUB",
                  })}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function AboutSection() {
  return (
    <section id="about" className="bg-muted/30 py-16">
      <div className="container grid gap-8 px-4 mx-auto md:grid-cols-2">
        <div className="space-y-4">
          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
            Экосистема
          </p>
          <h2 className="text-3xl font-semibold">Единая платформа магазина</h2>
          <p className="text-muted-foreground">
            Клиентский магазин и админ-панель используют общий API и SSO.
          </p>
        </div>
      </div>
    </section>
  );
}
