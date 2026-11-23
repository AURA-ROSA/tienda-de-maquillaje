"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { formatPrice } from "@/lib/price";
import {
  getAdminOrders,
  getUnseenOrdersCount,
  markOrderAsSeen,
  type AdminOrderFilter,
} from "@/actions/admin-queries";
import { confirmOrder, cancelOrder } from "@/actions/manage-orders";
import { logoutAdminAction } from "@/actions/auth-actions";

type OrderItemData = {
  id: string;
  productName: string;
  variantName: string;
  unitPrice: number;
  isWholesale: boolean;
  quantity: number;
};

type OrderData = {
  id: string;
  number: number;
  status: string;
  seenAt: Date | null;
  stockDeducted: boolean;
  customerName: string;
  customerDocument: string;
  customerPhone: string;
  customerEmail: string | null;
  address: string;
  department: string;
  city: string;
  note: string | null;
  paymentMethod: string;
  subtotal: number;
  shippingCost: number | null;
  total: number;
  createdAt: Date;
  items: OrderItemData[];
};

export default function AdminPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [unseenCount, setUnseenCount] = useState<number>(0);
  const [filter, setFilter] = useState<AdminOrderFilter>("ALL");
  const [loading, setLoading] = useState<boolean>(true);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );
  const [isPending, startTransition] = useTransition();

  const loadData = async () => {
    setLoading(true);
    try {
      const [fetchedOrders, count] = await Promise.all([
        getAdminOrders(filter),
        getUnseenOrdersCount(),
      ]);
      setOrders(fetchedOrders as unknown as OrderData[]);
      setUnseenCount(count);
    } catch {
      setFeedback({ type: "error", text: "Error al cargar pedidos." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filter]);

  const handleConfirm = (orderId: string) => {
    startTransition(async () => {
      setFeedback(null);
      const res = await confirmOrder(orderId);
      if (res.ok) {
        setFeedback({ type: "success", text: res.message });
        await loadData();
      } else {
        setFeedback({ type: "error", text: res.error });
      }
    });
  };

  const handleCancel = (orderId: string) => {
    startTransition(async () => {
      setFeedback(null);
      const res = await cancelOrder(orderId);
      if (res.ok) {
        setFeedback({ type: "success", text: res.message });
        await loadData();
      } else {
        setFeedback({ type: "error", text: res.error });
      }
    });
  };

  const handleMarkSeen = (orderId: string) => {
    startTransition(async () => {
      await markOrderAsSeen(orderId);
      await loadData();
    });
  };

  return (
    <div style={{ minHeight: "100vh", background: "#FAF5F0", paddingBottom: "60px" }}>
      {/* Header del Admin */}
      <header
        style={{
          background: "white",
          borderBottom: "1px solid #EEDFD6",
          padding: "16px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <Link href="/">
            <Image
              src="/logo.jpg"
              alt="Aura Rosa"
              width={140}
              height={45}
              style={{ objectFit: "contain" }}
            />
          </Link>
          <span
            style={{
              background: "#FFF0F5",
              color: "#D63378",
              fontWeight: "bold",
              fontSize: "12px",
              padding: "4px 10px",
              borderRadius: "999px",
            }}
          >
            Panel de la Dueña
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span
            style={{
              fontSize: "13px",
              color: unseenCount > 0 ? "#D63378" : "#7E6C72",
              fontWeight: unseenCount > 0 ? "bold" : "normal",
            }}
          >
            🔔 {unseenCount} pedidos nuevos sin ver
          </span>
          <Link
            href="/"
            style={{
              textDecoration: "none",
              color: "#2A2426",
              fontSize: "13px",
              border: "1px solid #EEDFD6",
              padding: "6px 14px",
              borderRadius: "999px",
            }}
          >
            ← Ir a la Tienda
          </Link>
          <button
            type="button"
            onClick={async () => {
              await logoutAdminAction();
              router.push("/admin/login");
            }}
            style={{
              background: "transparent",
              color: "#C62828",
              fontSize: "13px",
              border: "1px solid #EF9A9A",
              padding: "6px 14px",
              borderRadius: "999px",
              cursor: "pointer",
            }}
          >
            Cerrar Sesión 🚪
          </button>
        </div>
      </header>

      {/* Contenedor Principal */}
      <main style={{ maxWidth: "1200px", margin: "32px auto", padding: "0 20px" }}>
        {/* Banner de retroalimentación */}
        {feedback && (
          <div
            style={{
              padding: "12px 20px",
              borderRadius: "10px",
              marginBottom: "20px",
              fontSize: "14px",
              background: feedback.type === "success" ? "#E8F5E9" : "#FFEBEE",
              color: feedback.type === "success" ? "#2E7D32" : "#C62828",
              border: `1px solid ${feedback.type === "success" ? "#A5D6A7" : "#EF9A9A"}`,
            }}
          >
            {feedback.text}
          </div>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          <h1 style={{ fontFamily: "Georgia, serif", fontSize: "28px", margin: 0 }}>
            Gestión de Pedidos
          </h1>

          {/* Filtros */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {(
              [
                ["ALL", "Todos"],
                ["PENDING", "Pendientes"],
                ["CONFIRMED", "Confirmados"],
                ["CANCELLED", "Cancelados"],
              ] as const
            ).map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => setFilter(val as AdminOrderFilter)}
                style={{
                  background: filter === val ? "#D63378" : "white",
                  color: filter === val ? "white" : "#7E6C72",
                  border: "1px solid #EEDFD6",
                  padding: "6px 16px",
                  borderRadius: "999px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Tabla / Lista de pedidos */}
        {loading ? (
          <p style={{ textAlign: "center", color: "#7E6C72", margin: "60px 0" }}>
            Cargando pedidos...
          </p>
        ) : orders.length === 0 ? (
          <div
            style={{
              background: "white",
              padding: "48px 24px",
              textAlign: "center",
              borderRadius: "16px",
              border: "1px solid #EEDFD6",
            }}
          >
            <p style={{ margin: 0, color: "#7E6C72", fontSize: "16px" }}>
              No se encontraron pedidos con este filtro.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {orders.map((order) => {
              const isUnseen = order.seenAt === null;

              return (
                <div
                  key={order.id}
                  style={{
                    background: "white",
                    borderRadius: "16px",
                    border: isUnseen ? "2px solid #FF6FAE" : "1px solid #EEDFD6",
                    boxShadow: "0 6px 20px rgba(0,0,0,0.04)",
                    padding: "20px",
                  }}
                >
                  {/* Encabezado del pedido */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      borderBottom: "1px solid #F5EDF0",
                      paddingBottom: "12px",
                      marginBottom: "12px",
                      flexWrap: "wrap",
                      gap: "10px",
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: "18px", color: "#2A2426" }}>
                        Pedido #{order.number}
                      </strong>
                      {isUnseen && (
                        <span
                          style={{
                            background: "#FF6FAE",
                            color: "white",
                            fontSize: "11px",
                            fontWeight: "bold",
                            padding: "2px 8px",
                            borderRadius: "999px",
                            marginLeft: "8px",
                          }}
                        >
                          NUEVO
                        </span>
                      )}
                      <span
                        style={{
                          fontSize: "12px",
                          color: "#7E6C72",
                          marginLeft: "12px",
                        }}
                      >
                        {new Date(order.createdAt).toLocaleDateString("es-CO", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      {/* Estado */}
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: "bold",
                          padding: "4px 12px",
                          borderRadius: "999px",
                          background:
                            order.status === "CONFIRMED"
                              ? "#E8F5E9"
                              : order.status === "PENDING"
                              ? "#FFF3E0"
                              : "#FFEBEE",
                          color:
                            order.status === "CONFIRMED"
                              ? "#2E7D32"
                              : order.status === "PENDING"
                              ? "#E65100"
                              : "#C62828",
                        }}
                      >
                        {order.status}
                      </span>

                      {/* Marca de stock descontado */}
                      <span
                        style={{
                          fontSize: "11px",
                          color: order.stockDeducted ? "#2E7D32" : "#7E6C72",
                        }}
                      >
                        {order.stockDeducted ? "📦 Stock descontado" : "⏳ Stock en reserva"}
                      </span>
                    </div>
                  </div>

                  {/* Cuerpo del pedido: Datos del cliente + Productos */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                      gap: "20px",
                    }}
                  >
                    {/* Datos del Cliente */}
                    <div style={{ fontSize: "13px", lineHeight: "1.6" }}>
                      <p style={{ margin: "0 0 4px" }}>
                        <strong>Cliente:</strong> {order.customerName}
                      </p>
                      <p style={{ margin: "0 0 4px" }}>
                        <strong>Cédula:</strong> {order.customerDocument}
                      </p>
                      <p style={{ margin: "0 0 4px" }}>
                        <strong>Celular:</strong>{" "}
                        <a
                          href={`https://wa.me/57${order.customerPhone}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: "#25D366", fontWeight: "bold" }}
                        >
                          {order.customerPhone} (WhatsApp)
                        </a>
                      </p>
                      <p style={{ margin: "0 0 4px" }}>
                        <strong>Entrega:</strong> {order.address}, {order.city} ({order.department})
                      </p>
                      <p style={{ margin: "0 0 4px" }}>
                        <strong>Pago:</strong>{" "}
                        {order.paymentMethod === "CASH"
                          ? "Efectivo contra entrega"
                          : "Transferencia bancaria"}
                      </p>
                      {order.note && (
                        <p style={{ margin: "4px 0 0", color: "#D4AF37", fontStyle: "italic" }}>
                          Nota: {order.note}
                        </p>
                      )}
                    </div>

                    {/* Productos */}
                    <div>
                      <strong style={{ fontSize: "13px", display: "block", marginBottom: "6px" }}>
                        Productos en este pedido:
                      </strong>
                      <div
                        style={{
                          background: "#FFFDFB",
                          border: "1px solid #F5EDF0",
                          borderRadius: "10px",
                          padding: "10px 14px",
                        }}
                      >
                        {order.items.map((it) => (
                          <div
                            key={it.id}
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              fontSize: "13px",
                              padding: "4px 0",
                              borderBottom: "1px solid #F8F1F3",
                            }}
                          >
                            <span>
                              {it.quantity}x {it.productName} ({it.variantName})
                              {it.isWholesale && (
                                <span
                                  style={{
                                    fontSize: "10px",
                                    color: "#B88E18",
                                    marginLeft: "6px",
                                    fontWeight: "bold",
                                  }}
                                >
                                  [Mayorista]
                                </span>
                              )}
                            </span>
                            <strong>{formatPrice(it.unitPrice * it.quantity)}</strong>
                          </div>
                        ))}
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: "14px",
                            paddingTop: "8px",
                            marginTop: "4px",
                          }}
                        >
                          <strong>Total:</strong>
                          <strong style={{ color: "#D63378", fontSize: "16px" }}>
                            {formatPrice(order.total)}
                          </strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Acciones de la Dueña */}
                  <div
                    style={{
                      borderTop: "1px solid #F5EDF0",
                      paddingTop: "14px",
                      marginTop: "16px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "10px",
                    }}
                  >
                    <div>
                      {isUnseen && (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleMarkSeen(order.id)}
                          style={{
                            background: "transparent",
                            border: "1px solid #FF6FAE",
                            color: "#D63378",
                            padding: "6px 14px",
                            borderRadius: "999px",
                            fontSize: "12px",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          Marcar como revisado
                        </button>
                      )}
                    </div>

                    <div style={{ display: "flex", gap: "8px" }}>
                      {order.status === "PENDING" && (
                        <>
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => handleConfirm(order.id)}
                            style={{
                              background: "#2E7D32",
                              color: "white",
                              border: 0,
                              padding: "8px 18px",
                              borderRadius: "999px",
                              fontSize: "13px",
                              fontWeight: "bold",
                              cursor: "pointer",
                            }}
                          >
                            ✓ Confirmar y Descontar Stock
                          </button>
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => handleCancel(order.id)}
                            style={{
                              background: "#C62828",
                              color: "white",
                              border: 0,
                              padding: "8px 18px",
                              borderRadius: "999px",
                              fontSize: "13px",
                              fontWeight: "bold",
                              cursor: "pointer",
                            }}
                          >
                            ✕ Cancelar
                          </button>
                        </>
                      )}

                      {order.status === "CONFIRMED" && (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleCancel(order.id)}
                          style={{
                            background: "transparent",
                            border: "1px solid #C62828",
                            color: "#C62828",
                            padding: "6px 16px",
                            borderRadius: "999px",
                            fontSize: "12px",
                            fontWeight: "bold",
                            cursor: "pointer",
                          }}
                        >
                          Cancelar Pedido y Devolver Stock
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
