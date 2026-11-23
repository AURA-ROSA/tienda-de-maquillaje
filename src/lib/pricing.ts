// REGLAS OFICIALES DE PRECIOS Y LANZAMIENTO (AURA ROSA)
export const PRICING_RULES = {
  defaultWholesaleMinQty: 6,
  restockOnCancel: true,
  earlyBirdMaxBuyers: 20, // Primeras 20 clientas únicas
  earlyBirdDiscountPercent: 5, // 5% de descuento en primera compra
};

type PriceInput = {
  price: number;
  discountPercent: number | null;
  discountEndsAt: Date | null;
  wholesalePrice: number | null;
  wholesaleMinQty: number | null;
};

export type PricingOptions = {
  isEarlyBirdEligible?: boolean;
  now?: Date;
};

// qtyOfProduct = unidades de ESTE producto en el carrito, sumando todos sus tonos.
// Reglas:
// 1. Si califica para primeros 20 (Early Bird), aplica al menos el 5% de descuento en primera compra.
// 2. Si aplican descuento y mayorista, gana el precio mayorista (precio más bajo).
export function getUnitPrice(
  p: PriceInput,
  qtyOfProduct: number,
  options?: PricingOptions
) {
  const now = options?.now ?? new Date();
  const isEarlyBird = options?.isEarlyBirdEligible ?? false;

  const baseDiscount = p.discountPercent ?? 0;
  const effectiveDiscount = isEarlyBird
    ? Math.max(baseDiscount, PRICING_RULES.earlyBirdDiscountPercent)
    : baseDiscount;

  const hasDiscount =
    effectiveDiscount > 0 &&
    (!p.discountEndsAt || p.discountEndsAt > now);

  const retail = hasDiscount
    ? Math.round((p.price * (100 - effectiveDiscount)) / 100)
    : p.price;

  const minQty = p.wholesaleMinQty ?? PRICING_RULES.defaultWholesaleMinQty;
  const wholesaleApplies = p.wholesalePrice != null && qtyOfProduct >= minQty;

  // Gana el precio mayorista si aplica y es menor
  if (wholesaleApplies && p.wholesalePrice! < retail) {
    return {
      unitPrice: p.wholesalePrice!,
      original: p.price,
      isWholesale: true,
      hasDiscount: false,
      percent: 0,
    };
  }

  return {
    unitPrice: retail,
    original: p.price,
    isWholesale: false,
    hasDiscount,
    percent: hasDiscount ? effectiveDiscount : 0,
  };
}
