import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/price";
import { AddToCartButton } from "@/components/cart/AddToCartButton";

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="product-card">
      <div className="product-visual" aria-hidden="true">
        <span>{product.emoji}</span>
      </div>
      <div className="product-content">
        <span className="product-category">{product.category}</span>
        <h2>{product.name}</h2>
        <p>{product.description}</p>
        <div className="product-footer">
          <strong>{formatPrice(product.price)}</strong>
          <AddToCartButton product={product} />
        </div>
      </div>
    </article>
  );
}