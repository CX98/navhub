import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DB_PATH || path.join(__dirname, "data", "nav.db");

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS folders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    color TEXT DEFAULT '#6366f1',
    icon TEXT DEFAULT '',
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    color TEXT DEFAULT '#6366f1',
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    url TEXT NOT NULL,
    icon TEXT DEFAULT '',
    usage_guide TEXT DEFAULT '',
    folder_id INTEGER,
    sort_order INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL
  );

  CREATE TABLE IF NOT EXISTS site_tags (
    site_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    PRIMARY KEY (site_id, tag_id),
    FOREIGN KEY (site_id) REFERENCES sites(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_sites_folder_id ON sites(folder_id);
  CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
  CREATE INDEX IF NOT EXISTS idx_folders_name ON folders(name);
  CREATE INDEX IF NOT EXISTS idx_site_tags_tag_id ON site_tags(tag_id);
`);

// ==================== Async-compatible interface ====================
// Wrap SQLite sync calls into async functions so server.js can use the same
// async API regardless of whether it's SQLite or PostgreSQL

const sqliteAdapter = {
  async getAllFolders() {
    return db.prepare("SELECT * FROM folders ORDER BY sort_order, id").all();
  },
  async createFolder({ name, color = "#6366f1", icon = "", sort_order = 0 }) {
    const result = db.prepare("INSERT INTO folders (name, color, icon, sort_order) VALUES (?, ?, ?, ?)").run(name, color, icon, sort_order);
    return db.prepare("SELECT * FROM folders WHERE id = ?").get(result.lastInsertRowid);
  },
  async updateFolder(id, { name, color, icon, sort_order }) {
    db.prepare(`UPDATE folders SET name = COALESCE(?, name), color = COALESCE(?, color), icon = COALESCE(?, icon), sort_order = COALESCE(?, sort_order) WHERE id = ?`).run(name, color, icon, sort_order, id);
    return db.prepare("SELECT * FROM folders WHERE id = ?").get(id);
  },
  async deleteFolder(id) {
    const result = db.prepare("DELETE FROM folders WHERE id = ?").run(id);
    return result.changes > 0;
  },
  async folderExists(id) {
    return !!db.prepare("SELECT 1 FROM folders WHERE id = ?").get(id);
  },

  async getAllTags() {
    return db.prepare("SELECT * FROM tags ORDER BY sort_order, id").all();
  },
  async createTag({ name, color = "#6366f1", sort_order = 0 }) {
    const result = db.prepare("INSERT INTO tags (name, color, sort_order) VALUES (?, ?, ?)").run(name, color, sort_order);
    return db.prepare("SELECT * FROM tags WHERE id = ?").get(result.lastInsertRowid);
  },
  async updateTag(id, { name, color, sort_order }) {
    db.prepare(`UPDATE tags SET name = COALESCE(?, name), color = COALESCE(?, color), sort_order = COALESCE(?, sort_order) WHERE id = ?`).run(name, color, sort_order, id);
    return db.prepare("SELECT * FROM tags WHERE id = ?").get(id);
  },
  async deleteTag(id) {
    const result = db.prepare("DELETE FROM tags WHERE id = ?").run(id);
    return result.changes > 0;
  },
  async tagExists(id) {
    return !!db.prepare("SELECT 1 FROM tags WHERE id = ?").get(id);
  },

  async getAllSites({ folder_id, tag_id, search }) {
    let query = `SELECT s.*, f.name as folder_name, f.color as folder_color, f.icon as folder_icon FROM sites s LEFT JOIN folders f ON s.folder_id = f.id`;
    const conditions = [];
    const params = [];

    if (folder_id) { conditions.push("s.folder_id = ?"); params.push(folder_id); }
    if (tag_id) { query += " INNER JOIN site_tags st ON s.id = st.site_id"; conditions.push("st.tag_id = ?"); params.push(tag_id); }
    if (search) { conditions.push("(s.title LIKE ? OR s.description LIKE ? OR s.url LIKE ?)"); const p = `%${search}%`; params.push(p, p, p); }
    if (conditions.length > 0) query += " WHERE " + conditions.join(" AND ");
    query += " ORDER BY s.sort_order, s.id";

    const sites = db.prepare(query).all(...params);
    const getTags = db.prepare(`SELECT t.id, t.name, t.color FROM tags t INNER JOIN site_tags st ON t.id = st.tag_id WHERE st.site_id = ? ORDER BY t.sort_order, t.id`);
    return sites.map(site => ({ ...site, tags: getTags.all(site.id) }));
  },
  async getSiteById(id) {
    const site = db.prepare(`SELECT s.*, f.name as folder_name, f.color as folder_color, f.icon as folder_icon FROM sites s LEFT JOIN folders f ON s.folder_id = f.id WHERE s.id = ?`).get(id);
    if (!site) return null;
    const tags = db.prepare(`SELECT t.id, t.name, t.color FROM tags t INNER JOIN site_tags st ON t.id = st.tag_id WHERE st.site_id = ?`).all(id);
    return { ...site, tags };
  },
  async createSite({ title, description = "", url, icon = "", usage_guide = "", folder_id = null, tag_ids = [], sort_order = 0 }) {
    const result = db.prepare(`INSERT INTO sites (title, description, url, icon, usage_guide, folder_id, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(title, description, url, icon, usage_guide, folder_id, sort_order);
    const siteId = result.lastInsertRowid;
    if (tag_ids?.length > 0) {
      const insertTag = db.prepare("INSERT INTO site_tags (site_id, tag_id) VALUES (?, ?)");
      for (const tagId of tag_ids) insertTag.run(siteId, tagId);
    }
    return sqliteAdapter.getSiteById(siteId);
  },
  async updateSite(id, { title, description, url, icon, usage_guide, folder_id, tag_ids, sort_order }) {
    if (!db.prepare("SELECT 1 FROM sites WHERE id = ?").get(id)) return null;
    if (folder_id !== undefined) {
      db.prepare(`UPDATE sites SET title = COALESCE(?, title), description = COALESCE(?, description), url = COALESCE(?, url), icon = COALESCE(?, icon), usage_guide = COALESCE(?, usage_guide), folder_id = ?, sort_order = COALESCE(?, sort_order), updated_at = datetime('now') WHERE id = ?`).run(title, description, url, icon, usage_guide, folder_id, sort_order, id);
    } else {
      db.prepare(`UPDATE sites SET title = COALESCE(?, title), description = COALESCE(?, description), url = COALESCE(?, url), icon = COALESCE(?, icon), usage_guide = COALESCE(?, usage_guide), sort_order = COALESCE(?, sort_order), updated_at = datetime('now') WHERE id = ?`).run(title, description, url, icon, usage_guide, sort_order, id);
    }
    if (tag_ids !== undefined) {
      db.prepare("DELETE FROM site_tags WHERE site_id = ?").run(id);
      const insertTag = db.prepare("INSERT INTO site_tags (site_id, tag_id) VALUES (?, ?)");
      for (const tagId of tag_ids) insertTag.run(id, tagId);
    }
    return sqliteAdapter.getSiteById(id);
  },
  async deleteSite(id) {
    const result = db.prepare("DELETE FROM sites WHERE id = ?").run(id);
    return result.changes > 0;
  },
  async getStats() {
    const siteCount = db.prepare("SELECT COUNT(*) as count FROM sites").get().count;
    const tagCount = db.prepare("SELECT COUNT(*) as count FROM tags").get().count;
    const folderCount = db.prepare("SELECT COUNT(*) as count FROM folders").get().count;
    return { sites: siteCount, tags: tagCount, folders: folderCount };
  },

  // Seed helpers
  async seedClear() {
    db.prepare("DELETE FROM site_tags").run();
    db.prepare("DELETE FROM sites").run();
    db.prepare("DELETE FROM tags").run();
    db.prepare("DELETE FROM folders").run();
  },
  async seedFolders(folders) {
    const stmt = db.prepare("INSERT INTO folders (name, color, icon, sort_order) VALUES (?, ?, ?, ?)");
    const map = {};
    for (const f of folders) {
      const result = stmt.run(f.name, f.color, f.icon, f.order);
      map[f.name] = result.lastInsertRowid;
    }
    return map;
  },
  async seedTags(tags) {
    const stmt = db.prepare("INSERT INTO tags (name, color, sort_order) VALUES (?, ?, ?)");
    const map = {};
    for (const t of tags) {
      const result = stmt.run(t.name, t.color, t.order);
      map[t.name] = result.lastInsertRowid;
    }
    return map;
  },
  async seedSites(sites, folderMap, tagMap) {
    const insertSite = db.prepare(`INSERT INTO sites (title, description, url, icon, usage_guide, folder_id, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)`);
    const insertTag = db.prepare("INSERT INTO site_tags (site_id, tag_id) VALUES (?, ?)");
    for (let i = 0; i < sites.length; i++) {
      const s = sites[i];
      const siteResult = insertSite.run(s.title, s.description, s.url, "", s.usage_guide, folderMap[s.folder], i);
      const siteId = siteResult.lastInsertRowid;
      for (const tagName of s.tagNames) {
        if (tagMap[tagName]) insertTag.run(siteId, tagMap[tagName]);
      }
    }
  },
};

export default sqliteAdapter;
