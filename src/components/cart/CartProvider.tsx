"use client";

import { createContext, useContext, useReducer, type ReactNode } from "react";
import { cartReducer } from "@/lib/cart/reducer";
import type { CartItem } from "@/lib/cart/types";
import type { Product } from "@/lib/types";

type CartContextValue = {
  items: CartItem[];
  add: (product: Product) => void;
  remove: (productId: string) => void;
  decrease: (productId: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, dispatch] = useReducer(cartReducer, []);

  return (
    <CartContext.Provider
      value={{
        items,
        add: (product) => dispatch({ type: "add", product }),
        remove: (productId) => dispatch({ type: "remove", productId }),
        decrease: (productId) => dispatch({ type: "decrease", productId }),
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