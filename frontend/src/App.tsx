import { useState, useEffect } from "react";
import { Search, Plus, Compass, Pencil, Trash2, RefreshCw, LogOut, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useNavData } from "@/hooks/useNavData";
import { useAuth, AuthProvider } from "@/hooks/useAuth";
import { SiteCard } from "@/components/SiteCard";
import { CategoryFilter } from "@/components/CategoryFilter";
import { SiteDetailDialog } from "@/components/SiteDetailDialog";
import { SiteFormDialog } from "@/components/SiteFormDialog";
import { ManageDialog } from "@/components/ManageDialog";
import { LoginDialog } from "@/components/LoginDialog";
import type { Site } from "@/types";

function AppInner() {
  const auth = useAuth();
  const {
    folders,
    tags,
    sites,
    allSites,
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
    refresh,
    addSite,
    updateSite,
    deleteSite,
    addFolder,
    updateFolder,
    deleteFolder,
    addTag,
    updateTag,
    deleteTag,
  } = useNavData();

  const [selectedSite, setSelectedSite] = useState<Site | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Site | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);

  // Ctrl+Shift+K keyboard shortcut to open login dialog
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "K") {
        e.preventDefault();
        if (auth.isAuthenticated) {
          auth.logout();
        } else {
          setLoginOpen(true);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [auth.isAuthenticated, auth.logout]);

  const handleCardClick = (site: Site) => {
    setSelectedSite(site);
    setDetailOpen(true);
  };

  const handleAdd = () => {
    if (!auth.isAuthenticated) {
      setLoginOpen(true);
      return;
    }
    setEditingSite(null);
    setFormOpen(true);
  };

  const handleEdit = (site: Site) => {
    if (!auth.isAuthenticated) {
      setLoginOpen(true);
      return;
    }
    setEditingSite(site);
    setDetailOpen(false);
    setFormOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await deleteSite(deleteConfirm.id);
      setDeleteConfirm(null);
      setDetailOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  const handleSubmit = async (data: Partial<Site> & { tag_ids: number[] }) => {
    if (editingSite) {
      await updateSite(editingSite.id, data);
    } else {
      await addSite(data);
    }
  };

  const isAuth = auth.isAuthenticated;

  return (
    <>
      {/* Animated background */}
      <div className="animated-bg">
        <div
          className="animated-bg-blob"
          style={{
            width: "350px",
            height: "350px",
            background: "radial-gradient(circle, #6ee7b7, transparent)",
            top: "30%",
            left: "40%",
            animationDelay: "-5s",
          }}
        />
        <div
          className="animated-bg-blob"
          style={{
            width: "300px",
            height: "300px",
            background: "radial-gradient(circle, #93c5fd, transparent)",
            top: "60%",
            left: "10%",
            animationDelay: "-8s",
          }}
        />
      </div>

      {/* Main container */}
      <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          {/* Header */}
          <header className="mb-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 shadow-lg">
                  <Compass className="size-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">NavHub</h1>
                  <p className="text-sm text-gray-500">
                    你的专属导航站 · {allSites.length} 个站点
                    {isAuth && (
                      <span className="ml-2 inline-flex items-center gap-1 text-indigo-500">
                        · <KeyRound className="size-3" />
                        {auth.username}
                      </span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Auth status button */}
                {isAuth ? (
                  <Button
                    variant="ghost"
                    onClick={auth.logout}
                    className="glass rounded-xl hover:bg-white/60 text-gray-600"
                    title="退出登录 (Ctrl+Shift+K)"
                  >
                    <LogOut className="size-4" />
                    <span className="ml-1 text-sm">退出</span>
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    onClick={() => setLoginOpen(true)}
                    className="glass rounded-xl hover:bg-white/60 text-gray-600"
                    title="登录 (Ctrl+Shift+K)"
                  >
                    <KeyRound className="size-4" />
                    <span className="ml-1 text-sm">登录</span>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={refresh}
                  className="glass rounded-xl hover:bg-white/60"
                >
                  <RefreshCw className="size-4 text-gray-600" />
                </Button>
                {/* Only show Add button when logged in */}
                {isAuth && (
                  <Button
                    onClick={handleAdd}
                    className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-4 text-white shadow-md hover:from-indigo-600 hover:to-purple-600"
                  >
                    <Plus className="size-4" />
                    添加网站
                  </Button>
                )}
              </div>
            </div>

            {/* Search bar */}
            <div className="relative mt-4">
              <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索网站名称、描述或地址..."
                className="glass-input h-12 rounded-2xl border-white/40 pl-12 text-gray-800 placeholder:text-gray-400"
              />
            </div>
          </header>

          {/* Category filter */}
          <div className="mb-6">
            <CategoryFilter
              filterMode={filterMode}
              folders={folders}
              tags={tags}
              activeFolderId={activeFolderId}
              activeTagId={activeTagId}
              folderSiteCounts={folderSiteCounts}
              tagSiteCounts={tagSiteCounts}
              totalCount={allSites.length}
              onModeChange={setFilterMode}
              onFolderSelect={setActiveFolderId}
              onTagSelect={setActiveTagId}
              onManageClick={() => setManageOpen(true)}
              isAuth={isAuth}
            />
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="size-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-500" />
            </div>
          ) : error ? (
            <div className="glass-card rounded-2xl p-8 text-center">
              <p className="text-red-500">加载失败：{error}</p>
              <Button
                onClick={refresh}
                className="mt-4 rounded-xl bg-indigo-500 text-white"
              >
                重试
              </Button>
            </div>
          ) : sites.length === 0 ? (
            <div className="glass-card rounded-2xl p-12 text-center">
              <Compass className="mx-auto size-12 text-gray-300" />
              <p className="mt-4 text-gray-500">
                {searchQuery || activeFolderId !== null || activeTagId !== null
                  ? "没有找到匹配的网站"
                  : "还没有添加任何网站"}
              </p>
              {!isAuth && !searchQuery && activeFolderId === null && activeTagId === null && (
                <p className="mt-2 text-sm text-gray-400">
                  按 Ctrl+Shift+K 登录后可管理内容
                </p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sites.map((site, index) => (
                <SiteCard
                  key={site.id}
                  site={site}
                  index={index}
                  onClick={() => handleCardClick(site)}
                />
              ))}
            </div>
          )}

          {/* Footer */}
          <footer className="mt-12 text-center text-sm text-gray-400">
            <p>
              NavHub · 极简导航网站
              {!isAuth && " · 按 Ctrl+Shift+K 登录管理"}
            </p>
          </footer>
        </div>
      </div>

      {/* Detail Dialog */}
      <SiteDetailDialog
        site={selectedSite}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      />

      {/* Edit / Delete bar - only visible when logged in */}
      {isAuth && detailOpen && selectedSite && (
        <div className="pointer-events-none fixed bottom-6 left-1/2 z-[60] -translate-x-1/2">
          <div className="glass-strong pointer-events-auto flex items-center gap-2 rounded-2xl p-2 shadow-lg">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEdit(selectedSite)}
              className="rounded-xl hover:bg-white/40"
            >
              <Pencil className="size-4 text-gray-600" />
              编辑
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteConfirm(selectedSite)}
              className="rounded-xl text-red-500 hover:bg-red-50"
            >
              <Trash2 className="size-4" />
              删除
            </Button>
          </div>
        </div>
      )}

      {/* Add / Edit form */}
      <SiteFormDialog
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleSubmit}
        folders={folders}
        tags={tags}
        editingSite={editingSite}
      />

      {/* Manage folders/tags */}
      <ManageDialog
        open={manageOpen}
        onClose={() => setManageOpen(false)}
        folders={folders}
        tags={tags}
        folderSiteCounts={folderSiteCounts}
        tagSiteCounts={tagSiteCounts}
        onAddFolder={addFolder}
        onUpdateFolder={updateFolder}
        onDeleteFolder={deleteFolder}
        onAddTag={addTag}
        onUpdateTag={updateTag}
        onDeleteTag={deleteTag}
      />

      {/* Delete confirmation */}
      <Dialog open={!!deleteConfirm} onOpenChange={(v) => !v && setDeleteConfirm(null)}>
        <DialogContent className="glass-dialog-content max-w-sm rounded-2xl border-white/60">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-gray-800">
              确认删除
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">
            确定要删除「{deleteConfirm?.title}」吗？此操作不可撤销。
          </p>
          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => setDeleteConfirm(null)}
              className="rounded-xl text-gray-600 hover:bg-white/40"
            >
              取消
            </Button>
            <Button
              onClick={handleDelete}
              disabled={deleting}
              className="rounded-xl bg-red-500 text-white hover:bg-red-600"
            >
              {deleting ? "删除中..." : "确认删除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Login Dialog */}
      <LoginDialog
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onLogin={auth.login}
      />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}

export default App;
