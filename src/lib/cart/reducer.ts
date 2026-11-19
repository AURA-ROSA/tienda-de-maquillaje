import type { CartItem } from "@/lib/cart/types";
import type { Product } from "@/lib/types";

export type CartAction =
  | { type: "add"; product: Product }
  | { type: "remove"; productId: string }
  | { type: "decrease"; productId: string }
  | { type: "clear" };

export function cartReducer(state: CartItem[], action: CartAction): CartItem[] {
  switch (action.type) {
    case "add": {
      const existing = state.find((item) => item.id === action.product.id);
      if (existing) {
        return state.map((item) =>
          item.id === action.product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [...state, { ...action.product, quantity: 1 }];
    }
    case "remove":
      return state.filter((item) => item.id !== action.productId);
    case "decrease":
      return state
        .map((item) =>
          item.id === action.productId
            ? { ...item, quantity: item.quantity - 1 }
            : item,
        )
        .filter((item) => item.quantity > 0);
    case "clear":
      return [];
  }
}