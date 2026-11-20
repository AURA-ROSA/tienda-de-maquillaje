export type Category = { id: string; name: string; slug: string };

export type ProductVariant = {
  id: string;
  name: string;            // "Vinotinto", o "Único"
  colorHex: string | null;
  stock: number;
  isActive: boolean;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;                   // COP, entero
  wholesalePrice: number | null;
  wholesaleMinQty: number | null;
  imageUrl: string | null;
  discountPercent: number | null;
  discountEndsAt: Date | null;
  isActive: boolean;
  categoryId: string;
  variants: ProductVariant[];
};