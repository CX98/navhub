// JWT authentication using Web Crypto API
// Works natively in Cloudflare Workers - zero npm dependencies

interface Env {
  JWT_SECRET: string;
  AUTH_USERNAME: string;
  AUTH_PASSWORD_HASH: string;
}

// SHA-256 hash (matches backend's crypto.createHash("sha256").update(salt+password).digest("hex"))
async function sha256(message: string): string {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

// Base64url encode
function b64url(data: string | Uint8Array): string {
  const str = typeof data === "string" ? data : String.fromCharCode(...data);
  return btoa(str).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

// Sign JWT using HMAC-SHA256
async function signJwt(payload: Record<string, unknown>, secret: string): Promise<string> {
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = b64url(JSON.stringify(payload));
  const message = `${header}.${body}`;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  const sig = b64url(new Uint8Array(signature));
  return `${message}.${sig}`;
}

// Verify JWT and return payload
async function verifyJwt(token: string, secret: string): Promise<Record<string, unknown> | null> {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [header, body, sig] = parts;
  const message = `${header}.${body}`;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );

  // Decode base64url signature
  const sigBin = Uint8Array.from(atob(sig.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));
  const valid = await crypto.subtle.verify("HMAC", key, sigBin, encoder.encode(message));
  if (!valid) return null;

  try {
    const payload = JSON.parse(atob(body.replace(/-/g, "+").replace(/_/g, "/")));
    if (payload.exp && payload.exp < Date.now() / 1000) return null;
    return payload;
  } catch {
    return null;
  }
}

// Check credentials and return JWT if valid
async function login(username: string, password: string, env: Env): Promise<{ token: string; username: string } | null> {
  const salt = "navhub_salt_2026";
  const hash = await sha256(salt + password);

  if (username !== env.AUTH_USERNAME || hash !== env.AUTH_PASSWORD_HASH) {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    username,
    iat: now,
    exp: now + 7 * 24 * 3600, // 7 days
  };

  const token = await signJwt(payload, env.JWT_SECRET);
  return { token, username };
}

// Extract and verify token from Authorization header
async function getTokenPayload(request: Request, env: Env): Promise<Record<string, unknown> | null> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  return verifyJwt(token, env.JWT_SECRET);
}

export { login, getTokenPayload, sha256 };
export type { Env };
