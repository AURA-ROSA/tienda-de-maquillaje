"use server";

import { prisma } from "@/lib/prisma";
import type { OrderStatus } from "@/generated/prisma/client";

export type AdminOrderFilter = OrderStatus | "ALL";

/**
 * Obtiene el conteo de pedidos que la dueña aún no ha revisado.
 */
export async function getUnseenOrdersCount(): Promise<number> {
  try {
    return await prisma.order.count({
      where: {
        seenAt: null,
      },
    });
  } catch (error) {
    console.error("Error al contar pedidos sin ver:", error);
    return 0;
  }
}

/**
 * Obtiene el listado de pedidos para el panel administrativo, con filtro opcional por estado.
 */
export async function getAdminOrders(statusFilter: AdminOrderFilter = "ALL") {
  try {
    const whereClause = statusFilter === "ALL" ? {} : { status: statusFilter };

    return await prisma.order.findMany({
      where: whereClause,
      include: {
        items: {
          select: {
            id: true,
            productName: true,
            variantName: true,
            unitPrice: true,
            isWholesale: true,
            quantity: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  } catch (error) {
    console.error("Error al obtener pedidos del panel:", error);
    throw new Error("No se pudieron cargar los pedidos.");
  }
}

/**
 * Marca un pedido como visto si aún no ha sido revisado.
 */
export async function markOrderAsSeen(orderId: string): Promise<{ ok: boolean }> {
  try {
    await prisma.order.updateMany({
      where: {
        id: orderId,
        seenAt: null, // Solo lo actualiza si aún no tenía fecha registrada
      },
      data: {
        seenAt: new Date(),
      },
    });

    return { ok: true };
  } catch (error) {
    console.error("Error al marcar pedido como visto:", error);
    return { ok: false };
  }
}
