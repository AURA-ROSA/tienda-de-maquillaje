"use client";

import { useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { formatPrice } from "@/lib/price";
import { createWhatsAppOrder } from "@/lib/whatsapp";

export function CartDrawer() {
  const [open, setOpen] = useState(false);
  const { items, add, decrease, remove, clear } = useCart();
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <>
      <button
        className="cart-fab"
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir carrito"
      >
        <span>🛍️</span>
        {count > 0 && <span className="cart-count">{count}</span>}
      </button>

      {open && (
        <div className="cart-overlay" role="dialog" aria-modal="true" aria-label="Carrito">
          <button
            className="cart-backdrop"
            type="button"
            aria-label="Cerrar carrito"
            onClick={() => setOpen(false)}
          />
          <aside className="cart-panel">
            <div className="cart-header">
              <h2>Tu carrito</h2>
              <button type="button" onClick={() => setOpen(false)} aria-label="Cerrar">×</button>
            </div>

            {items.length === 0 ? (
              <p className="cart-empty">Todavía no agregas productos.</p>
            ) : (
              <>
                <div className="cart-items">
                  {items.map((item) => (
                    <div className="cart-item" key={item.id}>
                      <span className="cart-item-emoji">{item.emoji}</span>
                      <div className="cart-item-info">
                        <strong>{item.name}</strong>
                        <span>{formatPrice(item.price * item.quantity)}</span>
                        <div className="quantity">
                          <button type="button" onClick={() => decrease(item.id)}>−</button>
                          <span>{item.quantity}</span>
                          <button type="button" onClick={() => add(item)}>+</button>
                        </div>
                      </div>
                      <button
                        className="remove-item"
                        type="button"
                        onClick={() => remove(item.id)}
                        aria-label={`Eliminar ${item.name}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <div className="cart-footer">
                  <div className="cart-total">
                    <span>Total</span>
                    <strong>{formatPrice(total)}</strong>
                  </div>
                  <button
                    className="checkout-button"
                    type="button"
                    onClick={() => window.open(createWhatsAppOrder(items), "_blank", "noopener,noreferrer")}
                  >
                    Pedir por WhatsApp
                  </button>
                  <button className="clear-button" type="button" onClick={clear}>
                    Vaciar carrito
                  </button>
                </div>
              </>
            )}
          </aside>
        </div>
      )}
    </>
  );
}