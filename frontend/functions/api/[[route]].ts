// Cloudflare Pages Functions - catch-all API handler
// Handles all /api/* routes, uses Supabase PostgREST + Web Crypto JWT

import { sb } from "../_lib/supabase";
import { login, getTokenPayload } from "../_lib/auth";

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_KEY: string;
  JWT_SECRET: string;
  AUTH_USERNAME: string;
  AUTH_PASSWORD_HASH: string;
}

const SUPABASE_PROJECT_REF = "dcgwnrlizxpurjfhoerc";

function jsonResponse(data: unknown, status = 200, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

function errorResponse(message: string, status = 400) {
  return jsonResponse({ error: message }, status);
}

// Main request handler
async function handleRequest(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname.replace("/api/", "");
  const method = request.method;

  const supabase = sb({ url: env.SUPABASE_URL, serviceKey: env.SUPABASE_SERVICE_KEY });

  try {
    // ---- Health ----
    if (path === "health") {
      return jsonResponse({ status: "ok", db: "supabase", project: SUPABASE_PROJECT_REF });
    }

    // ---- Auth: Login ----
    if (path === "auth/login" && method === "POST") {
      const body = await request.json() as { username?: string; password?: string };
      if (!body.username || !body.password) return errorResponse("Missing username or password");
      const result = await login(body.username, body.password, env);
      if (!result) return errorResponse("Invalid credentials", 401);
      return jsonResponse(result);
    }

    // ---- Auth: Verify ----
    if (path === "auth/verify") {
      const payload = await getTokenPayload(request, env);
      if (!payload) return errorResponse("Invalid or expired token", 401);
      return jsonResponse({ valid: true, username: payload.username });
    }

    // ---- Auth check for write operations ----
    if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
      const payload = await getTokenPayload(request, env);
      if (!payload) return errorResponse("Unauthorized - please login first", 401);
    }

    // ---- Folders ----
    if (path === "folders") {
      if (method === "GET") {
        const folders = await supabase.query("folders", { select: "*", order: "sort_order.asc,id.asc" });
        return jsonResponse(folders);
      }
      if (method === "POST") {
        const body = await request.json() as Record<string, unknown>;
        const result = await supabase.insert("folders", body);
        return jsonResponse(result);
      }
    }

    // Folder by ID: folders/123
    const folderMatch = path.match(/^folders\/(\d+)$/);
    if (folderMatch) {
      const id = Number(folderMatch[1]);
      if (method === "GET") {
        const folder = await supabase.getById("folders", id);
        if (!folder) return errorResponse("Folder not found", 404);
        return jsonResponse(folder);
      }
      if (method === "PUT" || method === "PATCH") {
        const body = await request.json() as Record<string, unknown>;
        const result = await supabase.update("folders", { id: `eq.${id}` }, body);
        if (!result) return errorResponse("Folder not found", 404);
        return jsonResponse(result);
      }
      if (method === "DELETE") {
        const ok = await supabase.delete("folders", { id: `eq.${id}` });
        if (!ok) return errorResponse("Folder not found", 404);
        return jsonResponse({ success: true });
      }
    }

    // ---- Tags ----
    if (path === "tags") {
      if (method === "GET") {
        const tags = await supabase.query("tags", { select: "*", order: "sort_order.asc,id.asc" });
        return jsonResponse(tags);
      }
      if (method === "POST") {
        const body = await request.json() as Record<string, unknown>;
        const result = await supabase.insert("tags", body);
        return jsonResponse(result);
      }
    }

    // Tag by ID: tags/123
    const tagMatch = path.match(/^tags\/(\d+)$/);
    if (tagMatch) {
      const id = Number(tagMatch[1]);
      if (method === "GET") {
        const tag = await supabase.getById("tags", id);
        if (!tag) return errorResponse("Tag not found", 404);
        return jsonResponse(tag);
      }
      if (method === "PUT" || method === "PATCH") {
        const body = await request.json() as Record<string, unknown>;
        const result = await supabase.update("tags", { id: `eq.${id}` }, body);
        if (!result) return errorResponse("Tag not found", 404);
        return jsonResponse(result);
      }
      if (method === "DELETE") {
        const ok = await supabase.delete("tags", { id: `eq.${id}` });
        if (!ok) return errorResponse("Tag not found", 404);
        return jsonResponse({ success: true });
      }
    }

    // ---- Sites ----
    if (path === "sites") {
      if (method === "GET") {
        const folder_id = url.searchParams.get("folder_id");
        const tag_id = url.searchParams.get("tag_id");
        const search = url.searchParams.get("search");

        // Build filter
        const filter: Record<string, string> = {};
        if (folder_id) filter.folder_id = `eq.${folder_id}`;

        // If filtering by tag, we need to first find site_ids from site_tags
        let siteIdsFromTag: number[] | null = null;
        if (tag_id) {
          const siteTags = await supabase.query("site_tags", {
            select: "site_id",
            filter: { tag_id: `eq.${tag_id}` },
          });
          siteIdsFromTag = siteTags.map((st: { site_id: number }) => st.site_id);
          if (siteIdsFromTag.length === 0) return jsonResponse([]);
          filter.id = `in.(${siteIdsFromTag.join(",")})`;
        }

        // Search filter - PostgREST uses ilike pattern
        if (search) {
          // PostgREST doesn't support OR across columns in a simple filter,
          // so we do a broader match on title
          filter.title = `ilike.%${search}%`;
        }

        // Get sites with embedded folder info
        const sites = await supabase.query("sites", {
          select: "id,title,description,url,icon,usage_guide,folder_id,sort_order,created_at,updated_at,folders(id,name,color,icon)",
          filter,
          order: "sort_order.asc,id.asc",
        });

        // Get tags for all sites
        if (sites.length > 0) {
          const allSiteIds = sites.map((s: { id: number }) => s.id);
          const siteTagsRows = await supabase.query("site_tags", {
            select: "site_id,tags(id,name,color)",
            filter: { site_id: `in.(${allSiteIds.join(",")})` },
          });

          // Build tag map: site_id -> tags[]
          const tagMap: Record<number, Array<{ id: number; name: string; color: string }>> = {};
          for (const row of siteTagsRows) {
            const sid = row.site_id as number;
            if (!tagMap[sid]) tagMap[sid] = [];
            tagMap[sid].push(row.tags as { id: number; name: string; color: string });
          }

          // Attach tags to sites, flatten folder info
          const result = sites.map((site: Record<string, unknown>) => ({
            id: site.id,
            title: site.title,
            description: site.description,
            url: site.url,
            icon: site.icon || "",
            usage_guide: site.usage_guide || "",
            folder_id: site.folder_id,
            sort_order: site.sort_order,
            created_at: site.created_at,
            updated_at: site.updated_at,
            folder_name: (site.folders as Record<string, unknown>)?.name || null,
            folder_color: (site.folders as Record<string, unknown>)?.color || null,
            folder_icon: (site.folders as Record<string, unknown>)?.icon || "",
            tags: tagMap[site.id as number] || [],
          }));

          return jsonResponse(result);
        }

        // No sites found
        return jsonResponse([]);
      }

      if (method === "POST") {
        const body = await request.json() as Record<string, unknown>;
        const tag_ids = (body.tag_ids as number[]) || [];

        // Insert site first
        const siteData: Record<string, unknown> = {
          title: body.title,
          description: body.description || "",
          url: body.url,
          icon: body.icon || "",
          usage_guide: body.usage_guide || "",
          folder_id: body.folder_id || null,
          sort_order: body.sort_order || 0,
        };

        const inserted = await supabase.insert("sites", siteData);
        const siteId = inserted[0]?.id || inserted.id;

        // Insert site_tags if any
        if (tag_ids.length > 0) {
          const siteTagRows = tag_ids.map(tid => ({ site_id: siteId, tag_id: tid }));
          await supabase.insert("site_tags", siteTagRows);
        }

        // Return full site with tags
        return await getFullSite(siteId, supabase);
      }
    }

    // Site by ID: sites/123
    const siteMatch = path.match(/^sites\/(\d+)$/);
    if (siteMatch) {
      const id = Number(siteMatch[1]);
      if (method === "GET") {
        return await getFullSite(id, supabase);
      }
      if (method === "PUT" || method === "PATCH") {
        const body = await request.json() as Record<string, unknown>;
        const tag_ids = body.tag_ids as number[] | undefined;

        const siteData: Record<string, unknown> = {};
        if (body.title !== undefined) siteData.title = body.title;
        if (body.description !== undefined) siteData.description = body.description;
        if (body.url !== undefined) siteData.url = body.url;
        if (body.icon !== undefined) siteData.icon = body.icon;
        if (body.usage_guide !== undefined) siteData.usage_guide = body.usage_guide;
        if (body.folder_id !== undefined) siteData.folder_id = body.folder_id;
        if (body.sort_order !== undefined) siteData.sort_order = body.sort_order;
        siteData.updated_at = new Date().toISOString();

        await supabase.update("sites", { id: `eq.${id}` }, siteData);

        // Update tags if provided
        if (tag_ids !== undefined) {
          await supabase.delete("site_tags", { site_id: `eq.${id}` });
          if (tag_ids.length > 0) {
            const siteTagRows = tag_ids.map(tid => ({ site_id: id, tag_id: tid }));
            await supabase.insert("site_tags", siteTagRows);
          }
        }

        return await getFullSite(id, supabase);
      }
      if (method === "DELETE") {
        // site_tags will be cascade deleted by Supabase FK
        await supabase.delete("site_tags", { site_id: `eq.${id}` });
        const ok = await supabase.delete("sites", { id: `eq.${id}` });
        if (!ok) return errorResponse("Site not found", 404);
        return jsonResponse({ success: true });
      }
    }

    // ---- Stats ----
    if (path === "stats") {
      const sites = await supabase.query("sites", { select: "id", limit: 1 });
      const tags = await supabase.query("tags", { select: "id", limit: 1 });
      const folders = await supabase.query("folders", { select: "id", limit: 1 });
      // Use count endpoint
      const siteCount = await supabase.query("sites", { select: "count", filter: { select: "count" } });
      // Actually PostgREST count is via Prefer header. Let me just count differently.
      const allSites = await supabase.query("sites", { select: "id" });
      const allTags = await supabase.query("tags", { select: "id" });
      const allFolders = await supabase.query("folders", { select: "id" });
      return jsonResponse({
        sites: allSites.length,
        tags: allTags.length,
        folders: allFolders.length,
      });
    }

    // Unknown route
    return errorResponse("Not found", 404);
  } catch (err) {
    console.error("API Error:", err);
    return errorResponse(err instanceof Error ? err.message : "Internal server error", 500);
  }
}

// Helper: get a single site with folder info and tags
async function getFullSite(id: number, supabase: ReturnType<typeof sb>): Promise<Response> {
  const site = await supabase.getById("sites", id, "id,title,description,url,icon,usage_guide,folder_id,sort_order,created_at,updated_at,folders(id,name,color,icon)");
  if (!site) return errorResponse("Site not found", 404);

  const siteTags = await supabase.query("site_tags", {
    select: "tags(id,name,color)",
    filter: { site_id: `eq.${id}` },
  });

  const result = {
    ...site,
    folder_name: (site.folders as Record<string, unknown>)?.name || null,
    folder_color: (site.folders as Record<string, unknown>)?.color || null,
    folder_icon: (site.folders as Record<string, unknown>)?.icon || "",
    tags: siteTags.map((st: Record<string, unknown>) => st.tags as { id: number; name: string; color: string }),
  };

  return jsonResponse(result);
}

// Cloudflare Pages Function export
export const onRequest: PagesFunction<Env> = async (context) => {
  return handleRequest(context.request, context.env);
};
