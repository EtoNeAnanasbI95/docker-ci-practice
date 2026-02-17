"use client";

import { ProductInventoryItem } from "@/shared/types";
import { Button } from "@/shared/ui/button";
import { useCart } from "@/shared/context/cart-context";
import { useToast } from "@/shared/ui/toast";

type CartQuantityControlProps = {
  product: ProductInventoryItem;
};

export function CartQuantityControl({ product }: CartQuantityControlProps) {
  const cart = useCart();
  const { showToast } = useToast();
  const cartItem = cart.items.find((item) => item.id === product.id);
  const quantity = cartItem?.quantity ?? 0;
  const max = product.stockQuantity ?? Infinity;

  const handleIncrease = () => {
    if (quantity >= max) {
      showToast(`На складе доступно только ${max} шт.`, "error");
      return;
    }
    if (quantity === 0) {
      cart.addToCart(product);
    } else {
      cart.updateQuantity(product.id, quantity + 1, max);
    }
  };

  const handleDecrease = () => {
    if (quantity <= 1) {
      cart.removeFromCart(product.id);
    } else {
      cart.updateQuantity(product.id, quantity - 1, max);
    }
  };

  if (quantity === 0) {
    return (
      <Button size="sm" onClick={() => cart.addToCart(product)}>
        Добавить в корзину
      </Button>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 rounded-md border border-input px-3 py-1">
      <Button
        type="button"
        size="icon"
        variant="ghost"
        onClick={handleDecrease}
        aria-label="Уменьшить количество"
      >
        -
      </Button>
      <span className="min-w-[2ch] text-center font-semibold">{quantity}</span>
      <Button
        type="button"
        size="icon"
        variant="ghost"
        onClick={handleIncrease}
        disabled={quantity >= max}
        aria-label="Увеличить количество"
      >
        +
      </Button>
    </div>
  );
}
