import type { Category, Product } from "./types";

const categories: Category[] = [
  { id: "c1", name: "Labiales", slug: "labiales" },
  { id: "c2", name: "Contornos", slug: "contornos" },
  { id: "c3", name: "Sombras", slug: "sombras" },
];

const products: Product[] = [
  {
    id: "p1", name: "Labial mate", slug: "labial-mate",
    description: "Color intenso de larga duración.",
    price: 18000, wholesalePrice: 15000, wholesaleMinQty: 6,
    imageUrl: null, discountPercent: 5, discountEndsAt: null,
    isActive: true, categoryId: "c1",
    variants: [
      { id: "v1", name: "Rosa", colorHex: "#E75480", stock: 12, isActive: true },
      { id: "v2", name: "Vinotinto", colorHex: "#6D1A36", stock: 8, isActive: true },
      { id: "v3", name: "Nude", colorHex: "#C9A08A", stock: 0, isActive: true },
    ],
  },
  {
    id: "p2", name: "Contorno en crema", slug: "contorno-en-crema",
    description: "Define y esculpe el rostro.",
    price: 32000, wholesalePrice: null, wholesaleMinQty: null,
    imageUrl: null, discountPercent: null, discountEndsAt: null,
    isActive: true, categoryId: "c2",
    variants: [
      { id: "v4", name: "Claro", colorHex: "#D9B99B", stock: 5, isActive: true },
      { id: "v5", name: "Medio", colorHex: "#B98B64", stock: 3, isActive: true },
    ],
  },
  {
    id: "p3", name: "Paleta de sombras nude", slug: "paleta-sombras-nude",
    description: "12 tonos neutros.",
    price: 45000, wholesalePrice: null, wholesaleMinQty: null,
    imageUrl: null, discountPercent: null, discountEndsAt: null,
    isActive: true, categoryId: "c3",
    variants: [{ id: "v6", name: "Único", colorHex: null, stock: 0, isActive: true }],
  },
];

// MOCK. Cuando la base esté lista, este archivo solo hará:
//   export * from "./data.prisma";
export async function getCategories(): Promise<Category[]> {
  return categories;
}

export async function getProducts(): Promise<Product[]> {
  return products.filter((p) => p.isActive);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  return products.find((p) => p.slug === slug && p.isActive) ?? null;
}

export async function getCategoryWithProducts(
  slug: string
): Promise<{ category: Category; products: Product[] } | null> {
  const category = categories.find((c) => c.slug === slug);
  if (!category) return null;
  return {
    category,
    products: products.filter((p) => p.categoryId === category.id && p.isActive),
  };
}