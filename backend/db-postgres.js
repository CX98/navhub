import pg from "pg";

const { Pool } = pg;

// Supabase connection: use DATABASE_URL or individual params
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required for PostgreSQL mode. Set it to your Supabase connection string.");
}

const pool = new Pool({
  connectionString,
  ssl: connectionString.includes("supabase") ? { rejectUnauthorized: false } : false,
});

// Initialize tables on first connection
async function initTables() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS folders (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        color TEXT DEFAULT '#6366f1',
        icon TEXT DEFAULT '',
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS tags (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        color TEXT DEFAULT '#6366f1',
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS sites (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT DEFAULT '',
        url TEXT NOT NULL,
        icon TEXT DEFAULT '',
        usage_guide TEXT DEFAULT '',
        folder_id INTEGER REFERENCES folders(id) ON DELETE SET NULL,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS site_tags (
        site_id INTEGER NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
        tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
        PRIMARY KEY (site_id, tag_id)
      );

      CREATE INDEX IF NOT EXISTS idx_sites_folder_id ON sites(folder_id);
      CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
      CREATE INDEX IF NOT EXISTS idx_folders_name ON folders(name);
      CREATE INDEX IF NOT EXISTS idx_site_tags_tag_id ON site_tags(tag_id);
    `);
  } finally {
    client.release();
  }
}

// Run init on module load
let initPromise = initTables();

const postgresAdapter = {
  async getAllFolders() {
    await initPromise;
    const { rows } = await pool.query("SELECT * FROM folders ORDER BY sort_order, id");
    return rows;
  },
  async createFolder({ name, color = "#6366f1", icon = "", sort_order = 0 }) {
    await initPromise;
    const { rows } = await pool.query("INSERT INTO folders (name, color, icon, sort_order) VALUES ($1, $2, $3, $4) RETURNING *", [name, color, icon, sort_order]);
    return rows[0];
  },
  async updateFolder(id, { name, color, icon, sort_order }) {
    await initPromise;
    const { rows } = await pool.query(`UPDATE folders SET name = COALESCE($2, name), color = COALESCE($3, color), icon = COALESCE($4, icon), sort_order = COALESCE($5, sort_order) WHERE id = $1 RETURNING *`, [id, name, color, icon, sort_order]);
    return rows[0];
  },
  async deleteFolder(id) {
    await initPromise;
    const { rowCount } = await pool.query("DELETE FROM folders WHERE id = $1", [id]);
    return rowCount > 0;
  },
  async folderExists(id) {
    await initPromise;
    const { rows } = await pool.query("SELECT 1 FROM folders WHERE id = $1", [id]);
    return rows.length > 0;
  },

  async getAllTags() {
    await initPromise;
    const { rows } = await pool.query("SELECT * FROM tags ORDER BY sort_order, id");
    return rows;
  },
  async createTag({ name, color = "#6366f1", sort_order = 0 }) {
    await initPromise;
    const { rows } = await pool.query("INSERT INTO tags (name, color, sort_order) VALUES ($1, $2, $3) RETURNING *", [name, color, sort_order]);
    return rows[0];
  },
  async updateTag(id, { name, color, sort_order }) {
    await initPromise;
    const { rows } = await pool.query(`UPDATE tags SET name = COALESCE($2, name), color = COALESCE($3, color), sort_order = COALESCE($4, sort_order) WHERE id = $1 RETURNING *`, [id, name, color, sort_order]);
    return rows[0];
  },
  async deleteTag(id) {
    await initPromise;
    const { rowCount } = await pool.query("DELETE FROM tags WHERE id = $1", [id]);
    return rowCount > 0;
  },
  async tagExists(id) {
    await initPromise;
    const { rows } = await pool.query("SELECT 1 FROM tags WHERE id = $1", [id]);
    return rows.length > 0;
  },

  async getAllSites({ folder_id, tag_id, search }) {
    await initPromise;
    let query = `SELECT s.*, f.name as folder_name, f.color as folder_color, f.icon as folder_icon FROM sites s LEFT JOIN folders f ON s.folder_id = f.id`;
    const conditions = [];
    const params = [];
    let paramIdx = 1;

    if (folder_id) { conditions.push(`s.folder_id = $${paramIdx++}`); params.push(folder_id); }
    if (tag_id) { query += " INNER JOIN site_tags st ON s.id = st.site_id"; conditions.push(`st.tag_id = $${paramIdx++}`); params.push(tag_id); }
    if (search) { conditions.push(`(s.title ILIKE $${paramIdx++} OR s.description ILIKE $${paramIdx++} OR s.url ILIKE $${paramIdx++})`); const p = `%${search}%`; params.push(p, p, p); }
    if (conditions.length > 0) query += " WHERE " + conditions.join(" AND ");
    query += " ORDER BY s.sort_order, s.id";

    const { rows: sites } = await pool.query(query, params);
    // Attach tags for each site
    if (sites.length === 0) return sites;
    const siteIds = sites.map(s => s.id);
    const { rows: allSiteTags } = await pool.query(`SELECT st.site_id, t.id, t.name, t.color FROM tags t INNER JOIN site_tags st ON t.id = st.tag_id WHERE st.site_id = ANY($1) ORDER BY t.sort_order, t.id`, [siteIds]);
    const tagMap = {};
    for (const st of allSiteTags) {
      if (!tagMap[st.site_id]) tagMap[st.site_id] = [];
      tagMap[st.site_id].push({ id: st.id, name: st.name, color: st.color });
    }
    return sites.map(site => ({ ...site, tags: tagMap[site.id] || [] }));
  },
  async getSiteById(id) {
    await initPromise;
    const { rows } = await pool.query(`SELECT s.*, f.name as folder_name, f.color as folder_color, f.icon as folder_icon FROM sites s LEFT JOIN folders f ON s.folder_id = f.id WHERE s.id = $1`, [id]);
    if (rows.length === 0) return null;
    const site = rows[0];
    const { rows: tags } = await pool.query(`SELECT t.id, t.name, t.color FROM tags t INNER JOIN site_tags st ON t.id = st.tag_id WHERE st.site_id = $1 ORDER BY t.sort_order, t.id`, [id]);
    return { ...site, tags };
  },
  async createSite({ title, description = "", url, icon = "", usage_guide = "", folder_id = null, tag_ids = [], sort_order = 0 }) {
    await initPromise;
    const { rows } = await pool.query(`INSERT INTO sites (title, description, url, icon, usage_guide, folder_id, sort_order) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`, [title, description, url, icon, usage_guide, folder_id, sort_order]);
    const siteId = rows[0].id;
    if (tag_ids?.length > 0) {
      const values = tag_ids.map(t => `(${siteId}, ${t})`).join(",");
      await pool.query(`INSERT INTO site_tags (site_id, tag_id) VALUES ${values}`);
    }
    return postgresAdapter.getSiteById(siteId);
  },
  async updateSite(id, { title, description, url, icon, usage_guide, folder_id, tag_ids, sort_order }) {
    await initPromise;
    const { rows } = await pool.query("SELECT 1 FROM sites WHERE id = $1", [id]);
    if (rows.length === 0) return null;

    if (folder_id !== undefined) {
      await pool.query(`UPDATE sites SET title = COALESCE($2, title), description = COALESCE($3, description), url = COALESCE($4, url), icon = COALESCE($5, icon), usage_guide = COALESCE($6, usage_guide), folder_id = $7, sort_order = COALESCE($8, sort_order), updated_at = NOW() WHERE id = $1`, [id, title, description, url, icon, usage_guide, folder_id, sort_order]);
    } else {
      await pool.query(`UPDATE sites SET title = COALESCE($2, title), description = COALESCE($3, description), url = COALESCE($4, url), icon = COALESCE($5, icon), usage_guide = COALESCE($6, usage_guide), sort_order = COALESCE($7, sort_order), updated_at = NOW() WHERE id = $1`, [id, title, description, url, icon, usage_guide, sort_order]);
    }

    if (tag_ids !== undefined) {
      await pool.query("DELETE FROM site_tags WHERE site_id = $1", [id]);
      if (tag_ids.length > 0) {
        const values = tag_ids.map(t => `(${id}, ${t})`).join(",");
        await pool.query(`INSERT INTO site_tags (site_id, tag_id) VALUES ${values}`);
      }
    }
    return postgresAdapter.getSiteById(id);
  },
  async deleteSite(id) {
    await initPromise;
    const { rowCount } = await pool.query("DELETE FROM sites WHERE id = $1", [id]);
    return rowCount > 0;
  },
  async getStats() {
    await initPromise;
    const { rows: [stats] } = await pool.query("SELECT (SELECT COUNT(*) FROM sites) as sites, (SELECT COUNT(*) FROM tags) as tags, (SELECT COUNT(*) FROM folders) as folders");
    return stats;
  },

  // Seed helpers
  async seedClear() {
    await pool.query("DELETE FROM site_tags");
    await pool.query("DELETE FROM sites");
    await pool.query("DELETE FROM tags");
    await pool.query("DELETE FROM folders");
    // Reset sequences
    await pool.query("ALTER SEQUENCE sites_id_seq RESTART WITH 1");
    await pool.query("ALTER SEQUENCE tags_id_seq RESTART WITH 1");
    await pool.query("ALTER SEQUENCE folders_id_seq RESTART WITH 1");
  },
  async seedFolders(folders) {
    const map = {};
    for (const f of folders) {
      const { rows } = await pool.query("INSERT INTO folders (name, color, icon, sort_order) VALUES ($1, $2, $3, $4) RETURNING id", [f.name, f.color, f.icon, f.order]);
      map[f.name] = rows[0].id;
    }
    return map;
  },
  async seedTags(tags) {
    const map = {};
    for (const t of tags) {
      const { rows } = await pool.query("INSERT INTO tags (name, color, sort_order) VALUES ($1, $2, $3) RETURNING id", [t.name, t.color, t.order]);
      map[t.name] = rows[0].id;
    }
    return map;
  },
  async seedSites(sites, folderMap, tagMap) {
    for (let i = 0; i < sites.length; i++) {
      const s = sites[i];
      const { rows } = await pool.query(`INSERT INTO sites (title, description, url, icon, usage_guide, folder_id, sort_order) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`, [s.title, s.description, s.url, "", s.usage_guide, folderMap[s.folder], i]);
      const siteId = rows[0].id;
      for (const tagName of s.tagNames) {
        if (tagMap[tagName]) {
          await pool.query("INSERT INTO site_tags (site_id, tag_id) VALUES ($1, $2)", [siteId, tagMap[tagName]]);
        }
      }
    }
  },
};

export default postgresAdapter;
