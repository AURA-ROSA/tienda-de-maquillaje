import type { CartItem } from "@/lib/cart/types";
import { formatPrice } from "@/lib/price";

export function createWhatsAppOrder(items: CartItem[]): string {
  const lines = items.map(
    (item) =>
      `• ${item.quantity}x ${item.product.name} (${item.variantName}) - ${formatPrice(
        item.price * item.quantity
      )}`
  );
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const message = [
    "Hola Aura Rosa, quiero hacer un pedido:",
    "",
    ...lines,
    "",
    `Total: ${formatPrice(total)}`,
  ].join("\n");

  const phone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, "") ?? "";
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
