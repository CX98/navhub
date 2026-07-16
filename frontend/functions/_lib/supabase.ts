// Supabase REST API helpers using fetch
// Works natively in Cloudflare Workers - zero npm dependencies needed

interface SupabaseConfig {
  url: string;
  serviceKey: string;
}

function sb(config: SupabaseConfig) {
  const baseHeaders: Record<string, string> = {
    apikey: config.serviceKey,
    Authorization: `Bearer ${config.serviceKey}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };

  return {
    // GET with select, filter, order
    async query(table: string, opts: { select?: string; filter?: Record<string, string>; order?: string; limit?: number } = {}) {
      const params = new URLSearchParams();
      if (opts.select) params.set("select", opts.select);
      if (opts.filter) {
        for (const [k, v] of Object.entries(opts.filter)) params.set(k, v);
      }
      if (opts.order) params.set("order", opts.order);
      if (opts.limit) params.set("limit", String(opts.limit));

      const qs = params.toString();
      const url = `${config.url}/rest/v1/${table}${qs ? "?" + qs : ""}`;
      const res = await fetch(url, { headers: baseHeaders });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Supabase GET ${table}: ${res.status} ${text}`);
      }
      return res.json();
    },

    // GET single row by id
    async getById(table: string, id: number, select?: string) {
      const params = new URLSearchParams();
      if (select) params.set("select", select);
      params.set("id", `eq.${id}`);
      const url = `${config.url}/rest/v1/${table}?${params.toString()}`;
      const res = await fetch(url, { headers: baseHeaders });
      if (!res.ok) throw new Error(`Supabase getById ${table}: ${res.status}`);
      const rows = await res.json();
      return rows[0] || null;
    },

    // INSERT one or multiple rows
    async insert(table: string, data: Record<string, unknown> | Record<string, unknown>[]) {
      const url = `${config.url}/rest/v1/${table}`;
      const res = await fetch(url, {
        method: "POST",
        headers: baseHeaders,
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Supabase INSERT ${table}: ${res.status} ${text}`);
      }
      return res.json();
    },

    // UPDATE rows matching filter
    async update(table: string, filter: Record<string, string>, data: Record<string, unknown>) {
      const params = new URLSearchParams();
      for (const [k, v] of Object.entries(filter)) params.set(k, v);
      const url = `${config.url}/rest/v1/${table}?${params.toString()}`;
      const res = await fetch(url, {
        method: "PATCH",
        headers: baseHeaders,
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Supabase UPDATE ${table}: ${res.status} ${text}`);
      }
      const rows = await res.json();
      return rows[0] || null;
    },

    // DELETE rows matching filter
    async delete(table: string, filter: Record<string, string>) {
      const params = new URLSearchParams();
      for (const [k, v] of Object.entries(filter)) params.set(k, v);
      const url = `${config.url}/rest/v1/${table}?${params.toString()}`;
      const res = await fetch(url, {
        method: "DELETE",
        headers: { ...baseHeaders, Prefer: "return=representation" },
      });
      if (!res.ok) throw new Error(`Supabase DELETE ${table}: ${res.status}`);
      const rows = await res.json();
      return rows.length > 0;
    },
  };
}

export { sb };
export type { SupabaseConfig };
