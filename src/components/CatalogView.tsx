"use client";

import { useState } from "react";
import type { Category, Product } from "@/lib/types";
import { ProductCard } from "@/components/ProductCard";

export function CatalogView({
  categories,
  products,
}: {
  categories: Category[];
  products: Product[];
}) {
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");

  const filteredProducts =
    selectedCategory === "ALL"
      ? products
      : products.filter((p) => p.categoryId === selectedCategory);

  return (
    <section className="catalog-section" id="catalogo" aria-label="Catálogo de productos">
      <div className="catalog-header">
        <span className="section-label">Catálogo Exclusivo</span>
        <h2 className="section-title">Elige tus productos favoritos</h2>

        {/* Pestañas de categorías */}
        <div className="category-tabs">
          <button
            type="button"
            className={`category-tab-btn ${selectedCategory === "ALL" ? "active" : ""}`}
            onClick={() => setSelectedCategory("ALL")}
          >
            Todos ({products.length})
          </button>
          {categories.map((cat) => {
            const count = products.filter((p) => p.categoryId === cat.id).length;
            return (
              <button
                key={cat.id}
                type="button"
                className={`category-tab-btn ${selectedCategory === cat.id ? "active" : ""}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.name} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <p style={{ textAlign: "center", color: "#8E7D83", margin: "40px 0" }}>
          No hay productos disponibles en esta categoría actualmente.
        </p>
      ) : (
        <div className="products-grid">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}
