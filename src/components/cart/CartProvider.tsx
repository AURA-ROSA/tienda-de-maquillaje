"use client";

import { createContext, useContext, useReducer, type ReactNode } from "react";
import { cartReducer } from "@/lib/cart/reducer";
import type { CartItem } from "@/lib/cart/types";
import type { Product, ProductVariant } from "@/lib/types";

type CartContextValue = {
  items: CartItem[];
  add: (product: Product, variant: ProductVariant) => void;
  remove: (variantId: string) => void;
  decrease: (variantId: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, dispatch] = useReducer(cartReducer, []);

  return (
    <CartContext.Provider
      value={{
        items,
        add: (product, variant) => dispatch({ type: "add", product, variant }),
        remove: (variantId) => dispatch({ type: "remove", variantId }),
        decrease: (variantId) => dispatch({ type: "decrease", variantId }),
        clear: () => dispatch({ type: "clear" }),
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart debe usarse dentro de CartProvider");
  }
  return context;
}
