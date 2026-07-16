// Supabase PostgREST API helpers using fetch
// Zero npm dependencies - works natively in Cloudflare Workers

function sb(url: string, serviceKey: string) {
  const h: Record<string, string> = {
    apikey: serviceKey,
    Authorization: "Bearer " + serviceKey,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };

  return {
    // GET rows with optional select, filter, order
    async query(table: string, opts?: { select?: string; filter?: Record<string, string>; order?: string; limit?: number }) {
      const p = new URLSearchParams();
      if (opts?.select) p.set("select", opts.select);
      if (opts?.filter) for (const [k, v] of Object.entries(opts.filter)) p.set(k, v);
      if (opts?.order) p.set("order", opts.order);
      if (opts?.limit) p.set("limit", String(opts.limit));
      const qs = p.toString();
      const res = await fetch(url + "/rest/v1/" + table + (qs ? "?" + qs : ""), { headers: h });
      if (!res.ok) throw new Error("GET " + table + ": " + res.status + " " + await res.text());
      return res.json();
    },

    // GET single row by id
    async getById(table: string, id: number, select?: string) {
      const p = new URLSearchParams();
      if (select) p.set("select", select);
      p.set("id", "eq." + id);
      const res = await fetch(url + "/rest/v1/" + table + "?" + p.toString(), { headers: h });
      if (!res.ok) throw new Error("getById " + table + ": " + res.status);
      const rows = await res.json();
      return rows[0] || null;
    },

    // INSERT rows
    async insert(table: string, data: any) {
      const res = await fetch(url + "/rest/v1/" + table, {
        method: "POST",
        headers: h,
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("INSERT " + table + ": " + res.status + " " + await res.text());
      return res.json();
    },

    // UPDATE rows matching filter
    async update(table: string, filter: Record<string, string>, data: any) {
      const p = new URLSearchParams();
      for (const [k, v] of Object.entries(filter)) p.set(k, v);
      const res = await fetch(url + "/rest/v1/" + table + "?" + p.toString(), {
        method: "PATCH",
        headers: h,
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("UPDATE " + table + ": " + res.status + " " + await res.text());
      const rows = await res.json();
      return rows[0] || null;
    },

    // DELETE rows matching filter
    async del(table: string, filter: Record<string, string>) {
      const p = new URLSearchParams();
      for (const [k, v] of Object.entries(filter)) p.set(k, v);
      const res = await fetch(url + "/rest/v1/" + table + "?" + p.toString(), {
        method: "DELETE",
        headers: { ...h, Prefer: "return=representation" },
      });
      if (!res.ok) throw new Error("DELETE " + table + ": " + res.status);
      const rows = await res.json();
      return rows.length > 0;
    },
  };
}

export { sb };
