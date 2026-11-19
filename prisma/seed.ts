import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// El seed es una tarea puntual, así que usa la conexión de sesión
const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL!;
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const categories = [
  { name: "Labiales", slug: "labiales" },
  { name: "Contornos", slug: "contornos" },
  { name: "Sombras", slug: "sombras" },
];

// Datos de prueba: precios, mayorista y descuentos se confirman con la clienta
const products = [
  {
    name: "Labial mate", slug: "labial-mate",
    description: "Color intenso de larga duración.",
    price: 18000, wholesalePrice: 15000, wholesaleMinQty: 6,
    discountPercent: 5, category: "labiales",
    variants: [
      { name: "Rosa", colorHex: "#E75480", stock: 12 },
      { name: "Vinotinto", colorHex: "#6D1A36", stock: 8 },
      { name: "Nude", colorHex: "#C9A08A", stock: 0 },
    ],
  },
  {
    name: "Contorno en crema", slug: "contorno-en-crema",
    description: "Define y esculpe el rostro.",
    price: 32000, wholesalePrice: null, wholesaleMinQty: null,
    discountPercent: null, category: "contornos",
    variants: [
      { name: "Claro", colorHex: "#D9B99B", stock: 5 },
      { name: "Medio", colorHex: "#B98B64", stock: 3 },
    ],
  },
  {
    name: "Paleta de sombras nude", slug: "paleta-sombras-nude",
    description: "12 tonos neutros.",
    price: 45000, wholesalePrice: null, wholesaleMinQty: null,
    discountPercent: null, category: "sombras",
    variants: [{ name: "Único", colorHex: null, stock: 0 }],
  },
];

async function main() {
  for (const c of categories) {
    await prisma.category.upsert({
      where: { slug: c.slug },
      update: { name: c.name },
      create: c,
    });
  }

  for (const { category, variants, ...data } of products) {
    const cat = await prisma.category.findUniqueOrThrow({ where: { slug: category } });

    const product = await prisma.product.upsert({
      where: { slug: data.slug },
      update: { ...data, categoryId: cat.id },
      create: { ...data, categoryId: cat.id },
    });

    for (const v of variants) {
      await prisma.productVariant.upsert({
        where: { productId_name: { productId: product.id, name: v.name } },
        update: v,
        create: { ...v, productId: product.id },
      });
    }
  }

  console.log("Seed listo");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());