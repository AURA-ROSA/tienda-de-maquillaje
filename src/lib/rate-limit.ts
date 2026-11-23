type RateLimitRecord = {
  count: number;
  resetAt: number;
};

// Almacén en memoria por clave/IP
const ipStore = new Map<string, RateLimitRecord>();

export type RateLimitConfig = {
  maxAttempts: number;
  windowMs: number;
};

export function checkRateLimit(
  key: string,
  config: RateLimitConfig = { maxAttempts: 5, windowMs: 10 * 60 * 1000 }
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = ipStore.get(key);

  // Si no existe o ya expiró la ventana de tiempo, reiniciar
  if (!record || now > record.resetAt) {
    ipStore.set(key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, remaining: config.maxAttempts - 1 };
  }

  // Si superó el máximo de intentos permitidos
  if (record.count >= config.maxAttempts) {
    return { allowed: false, remaining: 0 };
  }

  // Incrementar intento
  record.count += 1;
  return { allowed: true, remaining: config.maxAttempts - record.count };
}

/**
 * Función auxiliar para limpiar la memoria en pruebas unitarias
 */
export function resetRateLimitStore(): void {
  ipStore.clear();
}
