"use server";

import { prisma } from "@/lib/prisma";

export type ManageOrderResult =
  | { ok: true; orderNumber: number; message: string }
  | { ok: false; error: string };

/**
 * Confirma un pedido y descuenta el stock en una sola transacción.
 * Protegido contra doble descuento.
 */
export async function confirmOrder(orderId: string): Promise<ManageOrderResult> {
  try {
    return await prisma.$transaction(async (tx) => {
      // 1. Obtener pedido con sus items
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });

      if (!order) {
        return { ok: false, error: "El pedido no existe." };
      }

      if (order.status === "CANCELLED") {
        return { ok: false, error: "No se puede confirmar un pedido que ha sido cancelado." };
      }

      if (order.stockDeducted || order.status === "CONFIRMED") {
        return { ok: false, error: "Este pedido ya fue confirmado y su stock ya fue descontado." };
      }

      // 2. Verificar disponibilidad de cada tono
      for (const item of order.items) {
        const variant = await tx.productVariant.findUnique({
          where: { id: item.variantId },
        });

        if (!variant) {
          throw new Error(`El tono "${item.variantName}" ya no existe en el catálogo.`);
        }

        if (variant.stock < item.quantity) {
          return {
            ok: false,
            error: `Stock insuficiente para confirmar: el tono "${variant.name}" tiene ${variant.stock} disponibles y el pedido requiere ${item.quantity}.`,
          };
        }
      }

      // 3. Descontar el stock de cada variante
      for (const item of order.items) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });
      }

      // 4. Marcar pedido como confirmado
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: "CONFIRMED",
          stockDeducted: true,
          seenAt: order.seenAt ?? new Date(),
        },
      });

      return {
        ok: true,
        orderNumber: order.number,
        message: `Pedido #${order.number} confirmado y stock descontado exitosamente.`,
      };
    });
  } catch (error) {
    console.error("Error en confirmOrder:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Error al confirmar el pedido.",
    };
  }
}

/**
 * Cancela un pedido. Si el stock ya había sido descontado, lo devuelve al inventario.
 */
export async function cancelOrder(orderId: string): Promise<ManageOrderResult> {
  try {
    return await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      });

      if (!order) {
        return { ok: false, error: "El pedido no existe." };
      }

      if (order.status === "CANCELLED") {
        return { ok: false, error: "El pedido ya se encuentra cancelado." };
      }

      // Si el stock fue descontado previamente, se devuelve
      if (order.stockDeducted) {
        for (const item of order.items) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: {
              stock: {
                increment: item.quantity,
              },
            },
          });
        }
      }

      // Marcar orden como cancelada y liberar marca de stock
      await tx.order.update({
        where: { id: order.id },
        data: {
          status: "CANCELLED",
          stockDeducted: false,
          seenAt: order.seenAt ?? new Date(),
        },
      });

      return {
        ok: true,
        orderNumber: order.number,
        message: `Pedido #${order.number} cancelado exitosamente${
          order.stockDeducted ? " y stock devuelto al inventario" : ""
        }.`,
      };
    });
  } catch (error) {
    console.error("Error en cancelOrder:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Error al cancelar el pedido.",
    };
  }
}
