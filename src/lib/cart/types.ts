import type { Product, ProductVariant } from "@/lib/types";

export type CartItem = {
  variantId: string;
  variantName: string;
  product: Product;
  quantity: number;
  price: number;
};
