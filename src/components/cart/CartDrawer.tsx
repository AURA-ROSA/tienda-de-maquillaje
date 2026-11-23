"use client";

import { useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { formatPrice } from "@/lib/price";
import { getUnitPrice } from "@/lib/pricing";
import { createOrder } from "@/actions/create-order";

export function CartDrawer() {
  const [open, setOpen] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successOrder, setSuccessOrder] = useState<{
    orderNumber: number;
    whatsappUrl: string;
  } | null>(null);

  // Campos del formulario de pedido
  const [formData, setFormData] = useState({
    customerName: "",
    customerDocument: "",
    customerPhone: "",
    customerEmail: "",
    address: "",
    department: "",
    city: "",
    note: "",
    paymentMethod: "TRANSFER" as "TRANSFER" | "CASH",
    acceptsDataPolicy: true,
  });

  const { items, add, decrease, remove, clear } = useCart();
  const totalItemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // Sumar cantidades por producto para evaluar precios mayoristas
  const productQuantities = new Map<string, number>();
  for (const item of items) {
    const cur = productQuantities.get(item.product.id) ?? 0;
    productQuantities.set(item.product.id, cur + item.quantity);
  }

  // Calcular precios y subtotales en vivo
  let subtotal = 0;
  const itemsWithPricing = items.map((item) => {
    const totalQty = productQuantities.get(item.product.id) || item.quantity;
    const priceInfo = getUnitPrice(item.product, totalQty);
    const itemTotal = priceInfo.unitPrice * item.quantity;
    subtotal += itemTotal;

    return {
      ...item,
      unitPrice: priceInfo.unitPrice,
      isWholesale: priceInfo.isWholesale,
      hasDiscount: priceInfo.hasDiscount,
      total: itemTotal,
    };
  });

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const payload = {
        customerName: formData.customerName,
        customerDocument: formData.customerDocument,
        customerPhone: formData.customerPhone,
        customerEmail: formData.customerEmail || undefined,
        address: formData.address,
        department: formData.department,
        city: formData.city,
        note: formData.note || undefined,
        paymentMethod: formData.paymentMethod,
        acceptsDataPolicy: formData.acceptsDataPolicy,
        items: items.map((i) => ({
          variantId: i.variantId,
          quantity: i.quantity,
        })),
      };

      const res = await createOrder(payload);

      if (!res.ok) {
        setErrorMsg(res.error);
        setLoading(false);
        return;
      }

      // Éxito: limpiar carrito y guardar info de confirmación
      clear();
      setSuccessOrder({
        orderNumber: res.orderNumber,
        whatsappUrl: res.whatsappUrl,
      });

      // Abrir WhatsApp en nueva pestaña
      if (typeof window !== "undefined") {
        window.open(res.whatsappUrl, "_blank", "noopener,noreferrer");
      }
    } catch {
      setErrorMsg("Ocurrió un error inesperado. Por favor intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setIsCheckingOut(false);
    setErrorMsg(null);
    setSuccessOrder(null);
  };

  return (
    <>
      {/* Botón flotante del carrito con destello dorado */}
      <button
        className="cart-fab"
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir bolsa de compras"
      >
        <span>🛍️</span>
        {totalItemCount > 0 && <span className="cart-count">{totalItemCount}</span>}
      </button>

      {open && (
        <div className="cart-overlay" role="dialog" aria-modal="true" aria-label="Carrito de compras">
          <button
            className="cart-backdrop"
            type="button"
            aria-label="Cerrar carrito"
            onClick={handleClose}
          />

          <aside className="cart-panel">
            {/* Encabezado */}
            <div className="cart-header">
              <div className="cart-header-title">
                <h2>{isCheckingOut ? "Finalizar Pedido" : "Bolsa de Compras"}</h2>
                <span className="cart-header-subtitle">Aura Rosa Makeup</span>
              </div>
              <button
                type="button"
                className="cart-close-btn"
                onClick={handleClose}
                aria-label="Cerrar"
              >
                ✕
              </button>
            </div>

            {/* Caso 1: Pedido confirmado exitosamente */}
            {successOrder ? (
              <div className="cart-success-view">
                <div className="success-icon">✨ 🌹 ✨</div>
                <h3>¡Pedido #{successOrder.orderNumber} Registrado!</h3>
                <p>
                  Tu pedido ha sido guardado en nuestro sistema. Hemos abierto WhatsApp para que
                  confirmes los detalles de envío con la dueña.
                </p>
                <a
                  href={successOrder.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="whatsapp-reopen-btn"
                >
                  Abrir WhatsApp nuevamente
                </a>
                <button
                  type="button"
                  className="continue-shopping-btn"
                  onClick={handleClose}
                >
                  Seguir explorando la tienda
                </button>
              </div>
            ) : items.length === 0 ? (
              /* Caso 2: Carrito vacío */
              <div className="cart-empty-view">
                <span className="cart-empty-icon">💄</span>
                <p className="cart-empty-text">Tu bolsa de compras está vacía.</p>
                <p className="cart-empty-sub">Elige tus tonos favoritos en el catálogo.</p>
              </div>
            ) : isCheckingOut ? (
              /* Caso 3: Formulario de Checkout (Datos del cliente) */
              <form onSubmit={handleSubmitOrder} className="checkout-form-container">
                <div className="checkout-summary-bar">
                  <span>Total a pagar ({totalItemCount} productos):</span>
                  <strong>{formatPrice(subtotal)}</strong>
                </div>

                {errorMsg && <div className="checkout-error-banner">⚠️ {errorMsg}</div>}

                <div className="form-fields-scroll">
                  <div className="form-group">
                    <label>Nombre y Apellidos *</label>
                    <input
                      required
                      type="text"
                      placeholder="Ej. Carolina Gómez"
                      value={formData.customerName}
                      onChange={(e) =>
                        setFormData({ ...formData, customerName: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Cédula / Documento *</label>
                      <input
                        required
                        type="text"
                        placeholder="Ej. 1020304050"
                        value={formData.customerDocument}
                        onChange={(e) =>
                          setFormData({ ...formData, customerDocument: e.target.value })
                        }
                      />
                    </div>
                    <div className="form-group">
                      <label>Celular (Colombia) *</label>
                      <input
                        required
                        type="tel"
                        placeholder="Ej. 3001234567"
                        value={formData.customerPhone}
                        onChange={(e) =>
                          setFormData({ ...formData, customerPhone: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Departamento *</label>
                      <input
                        required
                        type="text"
                        placeholder="Ej. Cundinamarca"
                        value={formData.department}
                        onChange={(e) =>
                          setFormData({ ...formData, department: e.target.value })
                        }
                      />
                    </div>
                    <div className="form-group">
                      <label>Ciudad / Municipio *</label>
                      <input
                        required
                        type="text"
                        placeholder="Ej. Bogotá"
                        value={formData.city}
                        onChange={(e) =>
                          setFormData({ ...formData, city: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Dirección de Entrega *</label>
                    <input
                      required
                      type="text"
                      placeholder="Ej. Calle 123 # 45-67 Apto 302"
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Correo Electrónico (opcional)</label>
                    <input
                      type="email"
                      placeholder="tu-correo@ejemplo.com"
                      value={formData.customerEmail}
                      onChange={(e) =>
                        setFormData({ ...formData, customerEmail: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Método de Pago Preferido *</label>
                    <div className="payment-options">
                      <label className="radio-label">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="TRANSFER"
                          checked={formData.paymentMethod === "TRANSFER"}
                          onChange={() =>
                            setFormData({ ...formData, paymentMethod: "TRANSFER" })
                          }
                        />
                        <span>Transferencia (Nequi, Daviplata, Bancolombia)</span>
                      </label>
                      <label className="radio-label">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="CASH"
                          checked={formData.paymentMethod === "CASH"}
                          onChange={() =>
                            setFormData({ ...formData, paymentMethod: "CASH" })
                          }
                        />
                        <span>Efectivo contra entrega</span>
                      </label>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Notas o Indicaciones (opcional)</label>
                    <input
                      type="text"
                      placeholder="Ej. Timbrar en el apto 201 o dejar en portería"
                      value={formData.note}
                      onChange={(e) =>
                        setFormData({ ...formData, note: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-group-checkbox">
                    <label>
                      <input
                        required
                        type="checkbox"
                        checked={formData.acceptsDataPolicy}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            acceptsDataPolicy: e.target.checked,
                          })
                        }
                      />
                      <span>
                        Acepto la política de tratamiento de datos personales para la gestión de mi
                        pedido.
                      </span>
                    </label>
                  </div>
                </div>

                <div className="checkout-actions">
                  <button
                    type="submit"
                    disabled={loading}
                    className="submit-order-button"
                  >
                    {loading ? "Procesando pedido..." : "Pedir por WhatsApp ✨"}
                  </button>
                  <button
                    type="button"
                    disabled={loading}
                    className="back-to-cart-button"
                    onClick={() => setIsCheckingOut(false)}
                  >
                    ← Volver a revisar la bolsa
                  </button>
                </div>
              </form>
            ) : (
              /* Caso 4: Lista de productos en el Carrito */
              <>
                <div className="cart-items">
                  {itemsWithPricing.map((item) => (
                    <div className="cart-item" key={item.variantId}>
                      <div className="cart-item-info">
                        <strong className="cart-item-title">{item.product.name}</strong>
                        <span className="cart-item-shade">
                          Tono: <strong>{item.variantName}</strong>
                        </span>
                        <div className="cart-item-pricing-row">
                          <span className="cart-item-price">
                            {formatPrice(item.total)}
                          </span>
                          {item.isWholesale && (
                            <span className="cart-wholesale-tag">Mayorista</span>
                          )}
                        </div>

                        <div className="quantity">
                          <button
                            type="button"
                            onClick={() => decrease(item.variantId)}
                            aria-label="Disminuir cantidad"
                          >
                            −
                          </button>
                          <span>{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() =>
                              add(
                                item.product,
                                item.product.variants.find((v) => v.id === item.variantId)!
                              )
                            }
                            aria-label="Aumentar cantidad"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <button
                        className="remove-item"
                        type="button"
                        onClick={() => remove(item.variantId)}
                        aria-label={`Eliminar ${item.product.name}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>

                <div className="cart-footer">
                  <div className="cart-subtotal-row">
                    <span>Subtotal</span>
                    <strong>{formatPrice(subtotal)}</strong>
                  </div>
                  <p className="cart-shipping-note">
                    * El costo de envío se coordina directamente por WhatsApp según tu ciudad.
                  </p>
                  <button
                    className="checkout-button"
                    type="button"
                    onClick={() => setIsCheckingOut(true)}
                  >
                    Continuar al Pedido →
                  </button>
                  <button className="clear-button" type="button" onClick={clear}>
                    Vaciar bolsa
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
