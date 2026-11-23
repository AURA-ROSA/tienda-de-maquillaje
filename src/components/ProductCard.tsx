"use client";

import { useState } from "react";
import type { Product, ProductVariant } from "@/lib/types";
import { formatPrice } from "@/lib/price";
import { AddToCartButton } from "@/components/cart/AddToCartButton";

export function ProductCard({ product }: { product: Product }) {
  // Elegir por defecto la primera variante que tenga stock, o la primera disponible
  const availableVariants = product.variants || [];
  const defaultVariant =
    availableVariants.find((v) => v.stock > 0) || availableVariants[0];

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(
    defaultVariant
  );

  // Calcular precio con descuento si aplica
  const hasDiscount = !!product.discountPercent && product.discountPercent > 0;
  const currentPrice = hasDiscount
    ? Math.round((product.price * (100 - product.discountPercent!)) / 100)
    : product.price;

  return (
    <article className="product-card">
      <div className="product-visual" aria-hidden="true">
        {/* Silueta/Placeholder elegante de cosmético de lujo */}
        <div className="product-visual-badge-container">
          {hasDiscount && (
            <span className="badge-discount">-{product.discountPercent}%</span>
          )}
          {product.wholesalePrice && (
            <span className="badge-wholesale">
              Mayorista ({product.wholesaleMinQty}+ un.)
            </span>
          )}
        </div>
        <div
          className="product-art-circle"
          style={{
            backgroundColor: selectedVariant?.colorHex || "#FCE7F0",
          }}
        >
          <span className="product-art-glimmer">✨</span>
        </div>
      </div>

      <div className="product-content">
        <h3 className="product-title">{product.name}</h3>
        <p className="product-desc">{product.description}</p>

        {/* Precios */}
        <div className="product-prices">
          <strong className="product-price">{formatPrice(currentPrice)}</strong>
          {hasDiscount && (
            <span className="product-price-old">{formatPrice(product.price)}</span>
          )}
        </div>

        {/* Muestra de precio mayorista */}
        {product.wholesalePrice && (
          <div className="wholesale-hint">
            Mayorista: <span>{formatPrice(product.wholesalePrice)}</span> (desde {product.wholesaleMinQty} un.)
          </div>
        )}

        {/* Selector de Tonos / Variantes */}
        {availableVariants.length > 0 && (
          <div className="variants-section">
            <span className="variants-label">
              Tono: <strong>{selectedVariant?.name || "Selecciona uno"}</strong>
            </span>
            <div className="variant-swatches">
              {availableVariants.map((v) => {
                const isSelected = selectedVariant?.id === v.id;
                const isOut = v.stock <= 0;

                return (
                  <button
                    key={v.id}
                    type="button"
                    title={`${v.name} ${isOut ? "(Agotado)" : `(${v.stock} disponibles)`}`}
                    className={`swatch-btn ${isSelected ? "swatch-active" : ""} ${isOut ? "swatch-out" : ""}`}
                    onClick={() => setSelectedVariant(v)}
                  >
                    <span
                      className="swatch-color"
                      style={{ backgroundColor: v.colorHex || "#E8D8CF" }}
                    />
                    {isOut && <span className="swatch-diagonal" />}
                  </button>
                );
              })}
            </div>
            {/* Disponibilidad del tono seleccionado */}
            <div className="stock-hint">
              {selectedVariant && selectedVariant.stock > 0 ? (
                <span className="stock-available">
                  ✓ {selectedVariant.stock} disponibles
                </span>
              ) : (
                <span className="stock-exhausted">✕ Agotado temporalmente</span>
              )}
            </div>
          </div>
        )}

        <div className="product-footer">
          {selectedVariant && (
            <AddToCartButton product={product} variant={selectedVariant} />
          )}
        </div>
      </div>
    </article>
  );
}
