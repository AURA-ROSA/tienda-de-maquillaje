"use client";

import { useCart } from "@/components/cart/CartProvider";
import type { Product } from "@/lib/types";

export function AddToCartButton({ product }: { product: Product }) {
  const { add } = useCart();

  return (
    <button className="add-button" type="button" onClick={() => add(product)}>
      Agregar al carrito
    </button>
  );
}