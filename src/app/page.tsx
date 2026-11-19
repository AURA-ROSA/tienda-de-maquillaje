import { ProductCard } from "@/components/ProductCard";
import { products } from "@/lib/data";

export default function Home() {
  return (
    <main className="store">
      <header className="hero">
        <span className="brand">AURA</span>
        <p>Maquillaje para sentirte extraordinaria</p>
        <h1>Encuentra tu nuevo favorito</h1>
      </header>
      <section className="catalog" aria-label="Catálogo de maquillaje">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </section>
    </main>
  );
}
