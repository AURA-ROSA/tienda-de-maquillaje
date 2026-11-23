"use client";

import { useCart } from "@/components/cart/CartProvider";
import type { Product, ProductVariant } from "@/lib/types";

export function AddToCartButton({
  product,
  variant,
}: {
  product: Product;
  variant: ProductVariant;
}) {
  const { add } = useCart();
  const isOutOfStock = !variant || variant.stock <= 0;

  return (
    <button
      className={`add-button ${isOutOfStock ? "out-of-stock" : ""}`}
      type="button"
      disabled={isOutOfStock}
      onClick={() => variant && add(product, variant)}
    >
      {isOutOfStock ? "Agotado" : "Agregar al carrito"}
    </button>
  );
}
