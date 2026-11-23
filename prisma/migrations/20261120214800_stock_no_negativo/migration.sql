-- AlterTable
ALTER TABLE "ProductVariant" ADD CONSTRAINT "product_variant_stock_non_negative" CHECK ("stock" >= 0);
