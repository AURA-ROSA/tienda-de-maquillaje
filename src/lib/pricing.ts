// VALORES DE PRUEBA: confirmar con la clienta antes de desplegar (ver PENDIENTES.md)
export const PRICING_RULES = {
  defaultWholesaleMinQty: 6,
  restockOnCancel: true,
};

type PriceInput = {
  price: number;
  discountPercent: number | null;
  discountEndsAt: Date | null;
  wholesalePrice: number | null;
  wholesaleMinQty: number | null;
};

// qtyOfProduct = unidades de ESTE producto en el carrito, sumando todos sus tonos.
// Regla de prueba: si aplican descuento y mayorista, gana el precio más bajo.
export function getUnitPrice(p: PriceInput, qtyOfProduct: number, now = new Date()) {
  const hasDiscount =
    !!p.discountPercent &&
    p.discountPercent > 0 &&
    (!p.discountEndsAt || p.discountEndsAt > now);

  const retail = hasDiscount
    ? Math.round((p.price * (100 - p.discountPercent!)) / 100)
    : p.price;

  const minQty = p.wholesaleMinQty ?? PRICING_RULES.defaultWholesaleMinQty;
  const wholesaleApplies = p.wholesalePrice != null && qtyOfProduct >= minQty;

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
    percent: hasDiscount ? p.discountPercent! : 0,
  };
}
