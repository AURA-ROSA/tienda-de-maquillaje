import type { CartItem } from "@/lib/cart/types";
import { formatPrice } from "@/lib/price";

export function createWhatsAppOrder(items: CartItem[]): string {
  const lines = items.map(
    (item) => `• ${item.quantity} x ${item.name} - ${formatPrice(item.price * item.quantity)}`,
  );
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const message = [
    "Hola, quiero hacer un pedido:",
    "",
    ...lines,
    "",
    `Total: ${formatPrice(total)}`,
  ].join("\n");

  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}