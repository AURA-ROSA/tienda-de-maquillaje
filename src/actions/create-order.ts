"use server";

import { prisma } from "@/lib/prisma";
import { getUnitPrice, PRICING_RULES } from "@/lib/pricing";
import { checkRateLimit } from "@/lib/rate-limit";
import { z } from "zod";

// Esquema de validación estricta
const CreateOrderSchema = z.object({
  customerName: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres"),
  customerDocument: z.string().trim().min(5, "La cédula o documento no es válido"),
  customerPhone: z
    .string()
    .trim()
    .regex(/^3\d{9}$/, "El teléfono debe ser un celular colombiano de 10 dígitos (ej: 3001234567)"),
  customerEmail: z.string().trim().email("Correo electrónico inválido").optional().or(z.literal("")),
  address: z.string().trim().min(5, "La dirección debe ser más específica"),
  department: z.string().trim().min(2, "El departamento es obligatorio"),
  city: z.string().trim().min(2, "La ciudad es obligatoria"),
  note: z.string().trim().max(300, "La nota es muy larga").optional().or(z.literal("")),
  paymentMethod: z.enum(["CASH", "TRANSFER"], {
    message: "Método de pago inválido (debe ser CASH o TRANSFER)",
  }),
  acceptsDataPolicy: z.literal(true, {
    message: "Debes aceptar la política de tratamiento de datos",
  }),
  items: z
    .array(
      z.object({
        variantId: z.string().min(1, "Variante requerida"),
        quantity: z.number().int().positive("La cantidad debe ser mayor a 0"),
      })
    )
    .min(1, "El pedido debe contener al menos un producto"),
});

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;

export type CreateOrderResult =
  | { ok: true; orderNumber: number; whatsappUrl: string }
  | { ok: false; error: string };

function formatCOP(value: number): string {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(value);
}

export async function createOrder(input: unknown): Promise<CreateOrderResult> {
  // 0. Protección contra spam (Rate Limiter)
  let clientIp = "127.0.0.1";
  try {
    const { headers } = await import("next/headers");
    const headerList = await headers();
    clientIp =
      headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headerList.get("x-real-ip") ||
      "127.0.0.1";
  } catch {
    // Si se ejecuta fuera de Next.js (ej. script de prueba), se usa un identificador seguro
    clientIp = "local-runner-ip";
  }

  const rateLimit = checkRateLimit(clientIp);
  if (!rateLimit.allowed) {
    return {
      ok: false,
      error: "Has realizado demasiados intentos de pedido. Por favor espera unos minutos antes de intentar de nuevo.",
    };
  }

  // 1. Validar datos del formulario
  const parsed = CreateOrderSchema.safeParse(input);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]?.message ?? "Datos inválidos";
    return { ok: false, error: firstIssue };
  }

  const data = parsed.data;

  try {
    // 2. Consultar variantes y productos reales desde la base de datos
    const variantIds = data.items.map((i) => i.variantId);
    const dbVariants = await prisma.productVariant.findMany({
      where: {
        id: { in: variantIds },
        isActive: true,
        product: { isActive: true },
      },
      include: {
        product: true,
      },
    });

    if (dbVariants.length !== variantIds.length) {
      return {
        ok: false,
        error: "Uno o más productos seleccionados ya no se encuentran disponibles.",
      };
    }

    // Mapa rápido para acceder a cada variante
    const variantMap = new Map(dbVariants.map((v) => [v.id, v]));

    // 3. Validar stock disponible
    for (const item of data.items) {
      const variant = variantMap.get(item.variantId)!;
      if (variant.stock < item.quantity) {
        return {
          ok: false,
          error: `Stock insuficiente para "${variant.product.name} (${variant.name})". Disponibles: ${variant.stock}, solicitados: ${item.quantity}.`,
        };
      }
    }

    // 4. Sumar cantidades por producto padre para evaluar precio mayorista
    const productTotalQty = new Map<string, number>();
    for (const item of data.items) {
      const variant = variantMap.get(item.variantId)!;
      const current = productTotalQty.get(variant.productId) ?? 0;
      productTotalQty.set(variant.productId, current + item.quantity);
    }

    // 5 y 6. Transacción Atómica: Evaluar promo de primeros 20, calcular precios y guardar orden
    const { order, calculatedItems, subtotal, isEarlyBirdApplied } = await prisma.$transaction(
      async (tx) => {
        // A. Contar compradores únicos históricos (excluyendo pedidos cancelados)
        const previousBuyerGroups = await tx.order.groupBy({
          by: ["customerPhone"],
          where: { status: { not: "CANCELLED" } },
        });
        const uniqueBuyersCount = previousBuyerGroups.length;

        // B. Verificar si este celular o cédula ya tiene compras previas no canceladas
        const priorOrder = await tx.order.findFirst({
          where: {
            status: { not: "CANCELLED" },
            OR: [
              { customerPhone: data.customerPhone },
              { customerDocument: data.customerDocument },
            ],
          },
        });

        const isFirstPurchase = !priorOrder;
        const isEarlyBirdEligible =
          uniqueBuyersCount < PRICING_RULES.earlyBirdMaxBuyers && isFirstPurchase;

        let orderSubtotal = 0;
        let earlyBirdAppliedToOrder = false;

        const itemsCalculated = data.items.map((item) => {
          const variant = variantMap.get(item.variantId)!;
          const totalQtyForProduct = productTotalQty.get(variant.productId)!;
          const pricing = getUnitPrice(variant.product, totalQtyForProduct, {
            isEarlyBirdEligible,
          });

          if (isEarlyBirdEligible && pricing.hasDiscount && !pricing.isWholesale) {
            earlyBirdAppliedToOrder = true;
          }

          const itemTotal = pricing.unitPrice * item.quantity;
          orderSubtotal += itemTotal;

          return {
            variantId: variant.id,
            productName: variant.product.name,
            variantName: variant.name,
            unitPrice: pricing.unitPrice,
            isWholesale: pricing.isWholesale,
            quantity: item.quantity,
          };
        });

        const newOrder = await tx.order.create({
          data: {
            status: "PENDING",
            seenAt: null,
            stockDeducted: false,
            customerName: data.customerName,
            customerDocument: data.customerDocument,
            customerPhone: data.customerPhone,
            customerEmail: data.customerEmail || null,
            address: data.address,
            department: data.department,
            city: data.city,
            note: data.note || null,
            paymentMethod: data.paymentMethod,
            subtotal: orderSubtotal,
            shippingCost: null, // Se coordina con la dueña por WhatsApp
            total: orderSubtotal,
            items: {
              create: itemsCalculated.map((ci) => ({
                variantId: ci.variantId,
                productName: ci.productName,
                variantName: ci.variantName,
                unitPrice: ci.unitPrice,
                isWholesale: ci.isWholesale,
                quantity: ci.quantity,
              })),
            },
          },
          select: {
            id: true,
            number: true,
          },
        });

        return {
          order: newOrder,
          calculatedItems: itemsCalculated,
          subtotal: orderSubtotal,
          isEarlyBirdApplied: earlyBirdAppliedToOrder,
        };
      }
    );

    // 7. Generar enlace de WhatsApp con resumen formateado
    const rawPhone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "";
    const cleanPhone = rawPhone.replace(/\D/g, "");

    const itemsSummary = calculatedItems
      .map(
        (ci) =>
          `• ${ci.quantity}x ${ci.productName} (${ci.variantName}) - ${formatCOP(ci.unitPrice * ci.quantity)}${ci.isWholesale ? " [Mayorista]" : ""}`
      )
      .join("\n");

    const messageLines = [
      `¡Hola Aura Rosa! Quiero confirmar mi pedido *#${order.number}*:`,
      "",
      `*Cliente:* ${data.customerName}`,
      `*Cédula:* ${data.customerDocument}`,
      `*Celular:* ${data.customerPhone}`,
      `*Ciudad:* ${data.city} (${data.department})`,
      `*Dirección:* ${data.address}`,
      `*Pago:* ${data.paymentMethod === "CASH" ? "Efectivo contra entrega" : "Transferencia bancaria"}`,
      data.note ? `*Nota:* ${data.note}` : "",
      isEarlyBirdApplied ? "🎉 *¡Descuento de bienvenida 5% (primeras 20 clientas) aplicado!*" : "",
      "",
      "*Productos:*",
      itemsSummary,
      "",
      `*Subtotal:* ${formatCOP(subtotal)}`,
      `*Envío:* Por confirmar`,
      `*Total:* ${formatCOP(subtotal)}`,
    ].filter(Boolean);

    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
      messageLines.join("\n")
    )}`;

    return {
      ok: true,
      orderNumber: order.number,
      whatsappUrl,
    };
  } catch (error) {
    console.error("Error al crear el pedido:", error);
    return {
      ok: false,
      error: "Ocurrió un error inesperado al procesar tu pedido. Por favor intenta de nuevo.",
    };
  }
}
