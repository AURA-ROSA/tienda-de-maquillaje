import type { Product } from "@/lib/types";

export type CartItem = Product & {
  quantity: number;
};