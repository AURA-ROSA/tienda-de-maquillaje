import { prisma } from "@/lib/prisma";
import type { Category, Product } from "./types";

// Los tonos inactivos no se muestran en la tienda
const productInclude = {
  variants: { where: { isActive: true }, orderBy: { name: "asc" as const } },
};

export async function getCategories(): Promise<Category[]> {
  return prisma.category.findMany({ orderBy: { name: "asc" } });
}

export async function getProducts(): Promise<Product[]> {
  return prisma.product.findMany({
    where: { isActive: true },
    include: productInclude,
    orderBy: { createdAt: "desc" },
  });
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  return prisma.product.findFirst({
    where: { slug, isActive: true },
    include: productInclude,
  });
}

export async function getCategoryWithProducts(
  slug: string
): Promise<{ category: Category; products: Product[] } | null> {
  const category = await prisma.category.findUnique({ where: { slug } });
  if (!category) return null;

  const products = await prisma.product.findMany({
    where: { categoryId: category.id, isActive: true },
    include: productInclude,
    orderBy: { createdAt: "desc" },
  });

  return { category, products };
}