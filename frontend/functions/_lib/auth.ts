// JWT auth using Web Crypto API - zero npm dependencies
// Works natively in Cloudflare Workers runtime

async function sha256(msg: string): string {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(msg));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function b64url(data: Uint8Array): string {
  return btoa(String.fromCharCode(...data)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

async function hmacSign(message: string, secret: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message)));
}

async function hmacVerify(message: string, signature: Uint8Array, secret: string): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );
  return crypto.subtle.verify("HMAC", key, signature, new TextEncoder().encode(message));
}

async function signJwt(payload: any, secret: string): string {
  const header = b64url(new TextEncoder().encode(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const body = b64url(new TextEncoder().encode(JSON.stringify(payload)));
  const sig = b64url(await hmacSign(header + "." + body, secret));
  return header + "." + body + "." + sig;
}

async function verifyJwt(token: string, secret: string): any | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [header, body, sig] = parts;
  const sigBytes = Uint8Array.from(atob(sig.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));
  const ok = await hmacVerify(header + "." + body, sigBytes, secret);
  if (!ok) return null;
  try {
    const payload = JSON.parse(atob(body.replace(/-/g, "+").replace(/_/g, "/")));
    if (payload.exp && payload.exp < Date.now() / 1000) return null;
    return payload;
  } catch { return null; }
}

async function login(username: string, password: string, env: any): any | null {
  const salt = "navhub_salt_2026";
  const hash = await sha256(salt + password);
  if (username !== env.AUTH_USERNAME || hash !== env.AUTH_PASSWORD_HASH) return null;
  const now = Math.floor(Date.now() / 1000);
  return { token: await signJwt({ username, iat: now, exp: now + 7 * 24 * 3600 }, env.JWT_SECRET), username };
}

async function getTokenPayload(request: Request, env: any): any | null {
  const auth = request.headers.get("Authorization");
  if (!auth || !auth.startsWith("Bearer ")) return null;
  return verifyJwt(auth.slice(7), env.JWT_SECRET);
}

export { login, getTokenPayload };
