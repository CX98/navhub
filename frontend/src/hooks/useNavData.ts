import { useState, useEffect, useCallback } from "react";
import { foldersApi, tagsApi, sitesApi } from "@/lib/api";
import type { Folder, Tag, Site } from "@/types";

export type FilterMode = "folder" | "tag";

export function useNavData() {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [filterMode, setFilterMode] = useState<FilterMode>("folder");
  const [activeFolderId, setActiveFolderId] = useState<number | null>(null);
  const [activeTagId, setActiveTagId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [foldersData, tagsData, sitesData] = await Promise.all([
        foldersApi.list(),
        tagsApi.list(),
        sitesApi.list(),
      ]);
      setFolders(foldersData);
      setTags(tagsData);
      setSites(sitesData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Filter sites based on mode and search
  const filteredSites = sites.filter((site) => {
    // Folder filter
    if (filterMode === "folder" && activeFolderId !== null && site.folder_id !== activeFolderId) return false;
    // Tag filter
    if (filterMode === "tag" && activeTagId !== null) {
      const siteTags = site.tags || [];
      if (!siteTags.some(t => t.id === activeTagId)) return false;
    }
    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        site.title.toLowerCase().includes(q) ||
        site.description.toLowerCase().includes(q) ||
        site.url.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Compute counts
  const folderSiteCounts = sites.reduce((acc, s) => {
    if (s.folder_id) acc[s.folder_id] = (acc[s.folder_id] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const tagSiteCounts = sites.reduce((acc, s) => {
    for (const t of s.tags || []) {
      acc[t.id] = (acc[t.id] || 0) + 1;
    }
    return acc;
  }, {} as Record<number, number>);

  // CRUD operations for sites
  const addSite = async (data: Partial<Site> & { tag_ids?: number[] }) => {
    await sitesApi.create(data);
    await fetchAll();
  };

  const updateSite = async (id: number, data: Partial<Site> & { tag_ids?: number[] }) => {
    await sitesApi.update(id, data);
    await fetchAll();
  };

  const deleteSite = async (id: number) => {
    await sitesApi.delete(id);
    await fetchAll();
  };

  // CRUD operations for folders
  const addFolder = async (data: Partial<Folder>) => {
    await foldersApi.create(data);
    await fetchAll();
  };

  const updateFolder = async (id: number, data: Partial<Folder>) => {
    await foldersApi.update(id, data);
    await fetchAll();
  };

  const deleteFolder = async (id: number) => {
    await foldersApi.delete(id);
    await fetchAll();
  };

  // CRUD operations for tags
  const addTag = async (data: Partial<Tag>) => {
    await tagsApi.create(data);
    await fetchAll();
  };

  const updateTag = async (id: number, data: Partial<Tag>) => {
    await tagsApi.update(id, data);
    await fetchAll();
  };

  const deleteTag = async (id: number) => {
    await tagsApi.delete(id);
    await fetchAll();
  };

  return {
    folders,
    tags,
    sites: filteredSites,
    allSites: sites,
    loading,
    error,
    filterMode,
    setFilterMode,
    activeFolderId,
    setActiveFolderId,
    activeTagId,
    setActiveTagId,
    searchQuery,
    setSearchQuery,
    folderSiteCounts,
    tagSiteCounts,
    refresh: fetchAll,
    addSite,
    updateSite,
    deleteSite,
    addFolder,
    updateFolder,
    deleteFolder,
    addTag,
    updateTag,
    deleteTag,
  };
}
