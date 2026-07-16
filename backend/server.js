import express from "express";
import cors from "cors";
import db from "./db.js";
import { handleLogin, handleVerify, authMiddleware } from "./auth.js";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Auth middleware - protects write operations (POST/PUT/DELETE)
app.use("/api/tags", authMiddleware);
app.use("/api/folders", authMiddleware);
app.use("/api/sites", authMiddleware);
app.use("/api/stats", authMiddleware);

// ==================== Auth API ====================

app.post("/api/auth/login", handleLogin);
app.get("/api/auth/verify", handleVerify);

// ==================== Folders API ====================

app.get("/api/folders", async (req, res) => {
  try {
    const folders = await db.getAllFolders();
    res.json(folders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/folders", async (req, res) => {
  const { name, color = "#6366f1", icon = "", sort_order = 0 } = req.body;
  if (!name) return res.status(400).json({ error: "Folder name is required" });

  try {
    const folder = await db.createFolder({ name, color, icon, sort_order });
    res.status(201).json(folder);
  } catch (err) {
    if (err.message.includes("unique") || err.message.includes("UNIQUE")) {
      res.status(409).json({ error: "Folder name already exists" });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

app.put("/api/folders/:id", async (req, res) => {
  const { id } = req.params;
  const { name, color, icon, sort_order } = req.body;

  try {
    const exists = await db.folderExists(id);
    if (!exists) return res.status(404).json({ error: "Folder not found" });

    const updated = await db.updateFolder(id, { name, color, icon, sort_order });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/folders/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const success = await db.deleteFolder(id);
    if (!success) return res.status(404).json({ error: "Folder not found" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== Tags API ====================

app.get("/api/tags", async (req, res) => {
  try {
    const tags = await db.getAllTags();
    res.json(tags);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/tags", async (req, res) => {
  const { name, color = "#6366f1", sort_order = 0 } = req.body;
  if (!name) return res.status(400).json({ error: "Tag name is required" });

  try {
    const tag = await db.createTag({ name, color, sort_order });
    res.status(201).json(tag);
  } catch (err) {
    if (err.message.includes("unique") || err.message.includes("UNIQUE")) {
      res.status(409).json({ error: "Tag name already exists" });
    } else {
      res.status(500).json({ error: err.message });
    }
  }
});

app.put("/api/tags/:id", async (req, res) => {
  const { id } = req.params;
  const { name, color, sort_order } = req.body;

  try {
    const exists = await db.tagExists(id);
    if (!exists) return res.status(404).json({ error: "Tag not found" });

    const updated = await db.updateTag(id, { name, color, sort_order });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/tags/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const success = await db.deleteTag(id);
    if (!success) return res.status(404).json({ error: "Tag not found" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== Sites API ====================

app.get("/api/sites", async (req, res) => {
  const { folder_id, tag_id, search } = req.query;
  try {
    const sites = await db.getAllSites({ folder_id, tag_id, search });
    res.json(sites);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/sites/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const site = await db.getSiteById(id);
    if (!site) return res.status(404).json({ error: "Site not found" });
    res.json(site);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/sites", async (req, res) => {
  const { title, description = "", url, icon = "", usage_guide = "", folder_id = null, tag_ids = [], sort_order = 0 } = req.body;
  if (!title || !url) return res.status(400).json({ error: "Title and URL are required" });

  try {
    const site = await db.createSite({ title, description, url, icon, usage_guide, folder_id, tag_ids, sort_order });
    res.status(201).json(site);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/sites/:id", async (req, res) => {
  const { id } = req.params;
  const { title, description, url, icon, usage_guide, folder_id, tag_ids, sort_order } = req.body;

  try {
    const site = await db.updateSite(id, { title, description, url, icon, usage_guide, folder_id, tag_ids, sort_order });
    if (!site) return res.status(404).json({ error: "Site not found" });
    res.json(site);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/sites/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const success = await db.deleteSite(id);
    if (!success) return res.status(404).json({ error: "Site not found" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== Stats ====================
app.get("/api/stats", async (req, res) => {
  try {
    const stats = await db.getStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString(), db: process.env.DATABASE_URL ? "postgresql" : "sqlite" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Navigation API server running on http://localhost:${PORT}`);
});
