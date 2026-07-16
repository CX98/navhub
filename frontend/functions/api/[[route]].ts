// Cloudflare Pages Functions - catch-all API handler
// Handles all /api/* routes via Supabase PostgREST + Web Crypto JWT

import { sb } from "../_lib/supabase";
import { login, getTokenPayload } from "../_lib/auth";

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function err(msg: string, status = 400) {
  return json({ error: msg }, status);
}

async function handleRequest(request: Request, env: any): Response {
  const url = new URL(request.url);
  // Strip /api prefix - path becomes "sites", "folders", "auth/login", etc.
  let path = url.pathname;
  if (path.startsWith("/api/")) path = path.slice(5);
  else if (path === "/api") path = "";
  // Remove trailing slash
  if (path.endsWith("/") && path.length > 1) path = path.slice(0, -1);

  const method = request.method;
  const supabase = sb(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);

  try {
    // ---- Health ----
    if (path === "health") return json({ status: "ok", db: "supabase" });

    // ---- Auth: Login ----
    if (path === "auth/login" && method === "POST") {
      const body = await request.json() as any;
      if (!body.username || !body.password) return err("Missing username or password");
      const result = await login(body.username, body.password, env);
      if (!result) return err("Invalid credentials", 401);
      return json(result);
    }

    // ---- Auth: Verify ----
    if (path === "auth/verify") {
      const payload = await getTokenPayload(request, env);
      if (!payload) return err("Invalid or expired token", 401);
      return json({ valid: true, username: payload.username });
    }

    // ---- Auth guard for write operations ----
    if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
      const payload = await getTokenPayload(request, env);
      if (!payload) return err("Unauthorized", 401);
    }

    // ---- Folders CRUD ----
    if (path === "folders") {
      if (method === "GET") return json(await supabase.query("folders", { select: "*", order: "sort_order.asc,id.asc" }));
      if (method === "POST") return json(await supabase.insert("folders", await request.json()));
    }
    const fm = path.match(/^folders\/(\d+)$/);
    if (fm) {
      const id = +fm[1];
      if (method === "GET") { const f = await supabase.getById("folders", id); return f ? json(f) : err("Not found", 404); }
      if (method === "PUT" || method === "PATCH") { const r = await supabase.update("folders", { id: "eq." + id }, await request.json()); return r ? json(r) : err("Not found", 404); }
      if (method === "DELETE") { const ok = await supabase.del("folders", { id: "eq." + id }); return ok ? json({ success: true }) : err("Not found", 404); }
    }

    // ---- Tags CRUD ----
    if (path === "tags") {
      if (method === "GET") return json(await supabase.query("tags", { select: "*", order: "sort_order.asc,id.asc" }));
      if (method === "POST") return json(await supabase.insert("tags", await request.json()));
    }
    const tm = path.match(/^tags\/(\d+)$/);
    if (tm) {
      const id = +tm[1];
      if (method === "GET") { const t = await supabase.getById("tags", id); return t ? json(t) : err("Not found", 404); }
      if (method === "PUT" || method === "PATCH") { const r = await supabase.update("tags", { id: "eq." + id }, await request.json()); return r ? json(r) : err("Not found", 404); }
      if (method === "DELETE") { const ok = await supabase.del("tags", { id: "eq." + id }); return ok ? json({ success: true }) : err("Not found", 404); }
    }

    // ---- Sites CRUD ----
    if (path === "sites" && method === "GET") {
      const filter: Record<string, string> = {};
      const folder_id = url.searchParams.get("folder_id");
      const tag_id = url.searchParams.get("tag_id");
      const search = url.searchParams.get("search");

      if (folder_id) filter.folder_id = "eq." + folder_id;
      if (tag_id) {
        const st = await supabase.query("site_tags", { select: "site_id", filter: { tag_id: "eq." + tag_id } });
        const ids = st.map((r: any) => r.site_id);
        if (!ids.length) return json([]);
        filter.id = "in.(" + ids.join(",") + ")";
      }
      if (search) filter.title = "ilike.%" + search + "%";

      const sites = await supabase.query("sites", {
        select: "id,title,description,url,icon,usage_guide,folder_id,sort_order,created_at,updated_at,folders(id,name,color,icon)",
        filter,
        order: "sort_order.asc,id.asc",
      });

      if (sites.length) {
        const ids = sites.map((s: any) => s.id);
        const sTags = await supabase.query("site_tags", {
          select: "site_id,tags(id,name,color)",
          filter: { site_id: "in.(" + ids.join(",") + ")" },
        });
        const tagMap: Record<number, any[]> = {};
        for (const r of sTags) { if (!tagMap[r.site_id]) tagMap[r.site_id] = []; tagMap[r.site_id].push(r.tags); }

        return json(sites.map((s: any) => ({
          ...s,
          folder_name: s.folders?.name ?? null,
          folder_color: s.folders?.color ?? null,
          folder_icon: s.folders?.icon ?? "",
          tags: tagMap[s.id] || [],
        })));
      }
      return json([]);
    }

    if (path === "sites" && method === "POST") {
      const body = await request.json() as any;
      const tag_ids = body.tag_ids || [];
      const siteData = { title: body.title, description: body.description || "", url: body.url, icon: body.icon || "", usage_guide: body.usage_guide || "", folder_id: body.folder_id ?? null, sort_order: body.sort_order || 0 };
      const inserted = await supabase.insert("sites", siteData);
      const siteId = inserted[0]?.id ?? inserted?.id;
      if (tag_ids.length) await supabase.insert("site_tags", tag_ids.map((t: number) => ({ site_id: siteId, tag_id: t })));
      return await getFullSite(siteId, supabase);
    }

    const sm = path.match(/^sites\/(\d+)$/);
    if (sm) {
      const id = +sm[1];
      if (method === "GET") return await getFullSite(id, supabase);
      if (method === "PUT" || method === "PATCH") {
        const body = await request.json() as any;
        const d: any = { updated_at: new Date().toISOString() };
        for (const k of ["title", "description", "url", "icon", "usage_guide", "folder_id", "sort_order"]) if (body[k] !== undefined) d[k] = body[k];
        await supabase.update("sites", { id: "eq." + id }, d);
        if (body.tag_ids !== undefined) {
          await supabase.del("site_tags", { site_id: "eq." + id });
          if (body.tag_ids.length) await supabase.insert("site_tags", body.tag_ids.map((t: number) => ({ site_id: id, tag_id: t })));
        }
        return await getFullSite(id, supabase);
      }
      if (method === "DELETE") {
        await supabase.del("site_tags", { site_id: "eq." + id });
        const ok = await supabase.del("sites", { id: "eq." + id });
        return ok ? json({ success: true }) : err("Not found", 404);
      }
    }

    // ---- Stats ----
    if (path === "stats") {
      const s = await supabase.query("sites", { select: "id" });
      const t = await supabase.query("tags", { select: "id" });
      const f = await supabase.query("folders", { select: "id" });
      return json({ sites: s.length, tags: t.length, folders: f.length });
    }

    return err("Not found", 404);
  } catch (e) {
    console.error("API Error:", e);
    return err(e instanceof Error ? e.message : "Internal server error", 500);
  }
}

async function getFullSite(id: number, supabase: any): Response {
  const site = await supabase.getById("sites", id, "id,title,description,url,icon,usage_guide,folder_id,sort_order,created_at,updated_at,folders(id,name,color,icon)");
  if (!site) return err("Site not found", 404);
  const sTags = await supabase.query("site_tags", { select: "tags(id,name,color)", filter: { site_id: "eq." + id } });
  return json({
    ...site,
    folder_name: site.folders?.name ?? null,
    folder_color: site.folders?.color ?? null,
    folder_icon: site.folders?.icon ?? "",
    tags: sTags.map((r: any) => r.tags),
  });
}

// Export as Cloudflare Pages Function
export const onRequest = async (context: any) => {
  return handleRequest(context.request, context.env);
};
