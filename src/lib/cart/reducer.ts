import type { CartItem } from "@/lib/cart/types";
import type { Product, ProductVariant } from "@/lib/types";

export type CartAction =
  | { type: "add"; product: Product; variant: ProductVariant }
  | { type: "remove"; variantId: string }
  | { type: "decrease"; variantId: string }
  | { type: "clear" };

export function cartReducer(state: CartItem[], action: CartAction): CartItem[] {
  switch (action.type) {
    case "add": {
      const existing = state.find((item) => item.variantId === action.variant.id);
      if (existing) {
        // No exceder el stock disponible
        const newQty = Math.min(existing.quantity + 1, action.variant.stock);
        return state.map((item) =>
          item.variantId === action.variant.id ? { ...item, quantity: newQty } : item
        );
      }
      return [
        ...state,
        {
          variantId: action.variant.id,
          variantName: action.variant.name,
          product: action.product,
          quantity: 1,
          price: action.product.price,
        },
      ];
    }
    case "remove":
      return state.filter((item) => item.variantId !== action.variantId);
    case "decrease":
      return state
        .map((item) =>
          item.variantId === action.variantId ? { ...item, quantity: item.quantity - 1 } : item
        )
        .filter((item) => item.quantity > 0);
    case "clear":
      return [];
    default:
      return state;
  }
}
