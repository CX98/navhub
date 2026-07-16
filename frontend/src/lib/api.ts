import type { Folder, Tag, Site, Stats } from "@/types";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3001/api";

// Get stored token
function getToken(): string | null {
  return localStorage.getItem("navhub_token");
}

// Build auth headers
function authHeaders(): Record<string, string> {
  const token = getToken();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: authHeaders(),
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    // If auth error, clear token
    if (res.status === 401) {
      localStorage.removeItem("navhub_token");
    }
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}

// Auth API
export const authApi = {
  login: (username: string, password: string) =>
    request<{ token: string; username: string; expiresIn: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  verify: () =>
    request<{ valid: boolean; username: string; role: string }>("/auth/verify"),
};

// Folders API
export const foldersApi = {
  list: () => request<Folder[]>("/folders"),
  create: (data: Partial<Folder>) =>
    request<Folder>("/folders", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: Partial<Folder>) =>
    request<Folder>(`/folders/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: number) =>
    request<{ success: boolean }>(`/folders/${id}`, { method: "DELETE" }),
};

// Tags API
export const tagsApi = {
  list: () => request<Tag[]>("/tags"),
  create: (data: Partial<Tag>) =>
    request<Tag>("/tags", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: Partial<Tag>) =>
    request<Tag>(`/tags/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: number) =>
    request<{ success: boolean }>(`/tags/${id}`, { method: "DELETE" }),
};

// Sites API
export const sitesApi = {
  list: (params?: { folder_id?: number; tag_id?: number; search?: string }) => {
    const query = new URLSearchParams();
    if (params?.folder_id) query.set("folder_id", String(params.folder_id));
    if (params?.tag_id) query.set("tag_id", String(params.tag_id));
    if (params?.search) query.set("search", params.search);
    const qs = query.toString();
    return request<Site[]>(`/sites${qs ? `?${qs}` : ""}`);
  },
  get: (id: number) => request<Site>(`/sites/${id}`),
  create: (data: Partial<Site> & { tag_ids?: number[] }) =>
    request<Site>("/sites", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: Partial<Site> & { tag_ids?: number[] }) =>
    request<Site>(`/sites/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: number) =>
    request<{ success: boolean }>(`/sites/${id}`, { method: "DELETE" }),
};

// Stats API
export const statsApi = {
  get: () => request<Stats>("/stats"),
};
