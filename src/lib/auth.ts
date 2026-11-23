const SECRET_KEY_RAW = process.env.AUTH_SECRET || "aura-rosa-jwt-salt-key-2026*";
export const ADMIN_COOKIE_NAME = "aura_admin_session";

async function getKey(): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    enc.encode(SECRET_KEY_RAW),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function createAdminToken(): Promise<string> {
  const key = await getKey();
  const payload = JSON.stringify({
    role: "admin",
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 días de validez
  });
  const enc = new TextEncoder();
  const data = enc.encode(payload);
  const signature = await crypto.subtle.sign("HMAC", key, data);
  
  const b64Data = btoa(payload);
  const b64Sig = btoa(String.fromCharCode(...new Uint8Array(signature)));
  return `${b64Data}.${b64Sig}`;
}

export async function verifyAdminToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return false;
    const [b64Data, b64Sig] = parts;

    const payloadStr = atob(b64Data);
    const payload = JSON.parse(payloadStr);

    // Verificar si expiró
    if (!payload.exp || Date.now() > payload.exp) {
      return false;
    }

    const key = await getKey();
    const enc = new TextEncoder();
    const data = enc.encode(payloadStr);
    const sigBytes = Uint8Array.from(atob(b64Sig), (c) => c.charCodeAt(0));

    return await crypto.subtle.verify("HMAC", key, sigBytes, data);
  } catch {
    return false;
  }
}
