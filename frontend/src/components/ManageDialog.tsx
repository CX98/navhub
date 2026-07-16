import { useState } from "react";
import { FolderIcon, TagIcon, Plus, Pencil, Trash2, Loader2, X, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Folder, Tag } from "@/types";

interface ManageDialogProps {
  open: boolean;
  onClose: () => void;
  folders: Folder[];
  tags: Tag[];
  folderSiteCounts: Record<number, number>;
  tagSiteCounts: Record<number, number>;
  onAddFolder: (data: Partial<Folder>) => Promise<void>;
  onUpdateFolder: (id: number, data: Partial<Folder>) => Promise<void>;
  onDeleteFolder: (id: number) => Promise<void>;
  onAddTag: (data: Partial<Tag>) => Promise<void>;
  onUpdateTag: (id: number, data: Partial<Tag>) => Promise<void>;
  onDeleteTag: (id: number) => Promise<void>;
}

export function ManageDialog({
  open,
  onClose,
  folders,
  tags,
  folderSiteCounts,
  tagSiteCounts,
  onAddFolder,
  onUpdateFolder,
  onDeleteFolder,
  onAddTag,
  onUpdateTag,
  onDeleteTag,
}: ManageDialogProps) {
  // Folder form state
  const [folderForm, setFolderForm] = useState({ name: "", color: "#6366f1" });
  const [editingFolderId, setEditingFolderId] = useState<number | null>(null);
  const [editFolderForm, setEditFolderForm] = useState({ name: "", color: "" });
  const [folderLoading, setFolderLoading] = useState(false);

  // Tag form state
  const [tagForm, setTagForm] = useState({ name: "", color: "#6366f1" });
  const [editingTagId, setEditingTagId] = useState<number | null>(null);
  const [editTagForm, setEditTagForm] = useState({ name: "", color: "" });
  const [tagLoading, setTagLoading] = useState(false);

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: "folder" | "tag"; id: number; name: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleAddFolder = async () => {
    if (!folderForm.name.trim()) return;
    setFolderLoading(true);
    try {
      await onAddFolder({ name: folderForm.name.trim(), color: folderForm.color });
      setFolderForm({ name: "", color: "#6366f1" });
    } catch (err) {
      console.error(err);
    } finally {
      setFolderLoading(false);
    }
  };

  const handleUpdateFolder = async () => {
    if (!editingFolderId || !editFolderForm.name.trim()) return;
    setFolderLoading(true);
    try {
      await onUpdateFolder(editingFolderId, { name: editFolderForm.name.trim(), color: editFolderForm.color });
      setEditingFolderId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setFolderLoading(false);
    }
  };

  const handleAddTag = async () => {
    if (!tagForm.name.trim()) return;
    setTagLoading(true);
    try {
      await onAddTag({ name: tagForm.name.trim(), color: tagForm.color });
      setTagForm({ name: "", color: "#6366f1" });
    } catch (err) {
      console.error(err);
    } finally {
      setTagLoading(false);
    }
  };

  const handleUpdateTag = async () => {
    if (!editingTagId || !editTagForm.name.trim()) return;
    setTagLoading(true);
    try {
      await onUpdateTag(editingTagId, { name: editTagForm.name.trim(), color: editTagForm.color });
      setEditingTagId(null);
    } catch (err) {
      console.error(err);
    } finally {
      setTagLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setDeleteLoading(true);
    try {
      if (deleteConfirm.type === "folder") {
        await onDeleteFolder(deleteConfirm.id);
      } else {
        await onDeleteTag(deleteConfirm.id);
      }
      setDeleteConfirm(null);
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Predefined colors
  const colors = [
    "#6366f1", "#8b5cf6", "#ec4899", "#ef4444", "#f59e0b",
    "#f97316", "#22c55e", "#10b981", "#14b8a6", "#3b82f6",
    "#0ea5e9", "#64748b",
  ];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="glass-dialog-content max-w-2xl rounded-2xl border-white/60 max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-gray-800">
            管理文件夹与标签
          </DialogTitle>
        </DialogHeader>

        {/* ====== Folders Section ====== */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <FolderIcon className="size-4 text-indigo-500" />
            文件夹管理
          </div>

          {/* Add new folder */}
          <div className="glass flex items-center gap-2 rounded-xl p-3">
            <Input
              value={folderForm.name}
              onChange={(e) => setFolderForm({ ...folderForm, name: e.target.value })}
              placeholder="新文件夹名称..."
              className="glass-input rounded-lg border-white/40 text-gray-800 placeholder:text-gray-400 h-9"
            />
            <div className="flex items-center gap-1">
              {colors.slice(0, 6).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setFolderForm({ ...folderForm, color: c })}
                  className={`size-5 rounded-full transition-all ${folderForm.color === c ? "ring-2 ring-offset-1 ring-gray-400 scale-110" : "hover:scale-105"}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <Button
              onClick={handleAddFolder}
              disabled={folderLoading || !folderForm.name.trim()}
              className="rounded-lg bg-indigo-500 text-white h-9 px-3"
            >
              {folderLoading ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            </Button>
          </div>

          {/* Existing folders list */}
          <div className="space-y-2">
            {folders.map((folder) => {
              const count = folderSiteCounts[folder.id] || 0;
              const isEditing = editingFolderId === folder.id;

              if (isEditing) {
                return (
                  <div key={folder.id} className="glass flex items-center gap-2 rounded-xl p-3">
                    <Input
                      value={editFolderForm.name}
                      onChange={(e) => setEditFolderForm({ ...editFolderForm, name: e.target.value })}
                      className="glass-input rounded-lg border-white/40 text-gray-800 h-9"
                    />
                    <div className="flex items-center gap-1">
                      {colors.slice(0, 6).map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setEditFolderForm({ ...editFolderForm, color: c })}
                          className={`size-5 rounded-full transition-all ${editFolderForm.color === c ? "ring-2 ring-offset-1 ring-gray-400 scale-110" : "hover:scale-105"}`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                    <Button
                      onClick={handleUpdateFolder}
                      disabled={folderLoading}
                      className="rounded-lg bg-green-500 text-white h-9 px-2"
                    >
                      <Check className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setEditingFolderId(null)}
                      className="rounded-lg h-9 px-2 text-gray-500"
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                );
              }

              return (
                <div key={folder.id} className="glass flex items-center justify-between rounded-xl p-3">
                  <div className="flex items-center gap-2">
                    <span className="size-3 rounded-full" style={{ backgroundColor: folder.color }} />
                    <span className="font-medium text-gray-800">{folder.name}</span>
                    <span className="rounded-full bg-black/5 px-1.5 py-0.5 text-xs text-gray-500">
                      {count} 个网站
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingFolderId(folder.id);
                        setEditFolderForm({ name: folder.name, color: folder.color });
                      }}
                      className="rounded-lg h-8 px-2 text-gray-500 hover:text-gray-700"
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteConfirm({ type: "folder", id: folder.id, name: folder.name })}
                      className="rounded-lg h-8 px-2 text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
            {folders.length === 0 && (
              <p className="text-center text-sm text-gray-400 py-4">暂无文件夹</p>
            )}
          </div>
        </div>

        {/* ====== Tags Section ====== */}
        <div className="space-y-4 mt-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <TagIcon className="size-4 text-purple-500" />
            标签管理
          </div>

          {/* Add new tag */}
          <div className="glass flex items-center gap-2 rounded-xl p-3">
            <Input
              value={tagForm.name}
              onChange={(e) => setTagForm({ ...tagForm, name: e.target.value })}
              placeholder="新标签名称..."
              className="glass-input rounded-lg border-white/40 text-gray-800 placeholder:text-gray-400 h-9"
            />
            <div className="flex items-center gap-1">
              {colors.slice(0, 6).map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setTagForm({ ...tagForm, color: c })}
                  className={`size-5 rounded-full transition-all ${tagForm.color === c ? "ring-2 ring-offset-1 ring-gray-400 scale-110" : "hover:scale-105"}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <Button
              onClick={handleAddTag}
              disabled={tagLoading || !tagForm.name.trim()}
              className="rounded-lg bg-purple-500 text-white h-9 px-3"
            >
              {tagLoading ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
            </Button>
          </div>

          {/* Existing tags list */}
          <div className="space-y-2">
            {tags.map((tag) => {
              const count = tagSiteCounts[tag.id] || 0;
              const isEditing = editingTagId === tag.id;

              if (isEditing) {
                return (
                  <div key={tag.id} className="glass flex items-center gap-2 rounded-xl p-3">
                    <Input
                      value={editTagForm.name}
                      onChange={(e) => setEditTagForm({ ...editTagForm, name: e.target.value })}
                      className="glass-input rounded-lg border-white/40 text-gray-800 h-9"
                    />
                    <div className="flex items-center gap-1">
                      {colors.slice(0, 6).map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setEditTagForm({ ...editTagForm, color: c })}
                          className={`size-5 rounded-full transition-all ${editTagForm.color === c ? "ring-2 ring-offset-1 ring-gray-400 scale-110" : "hover:scale-105"}`}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                    <Button
                      onClick={handleUpdateTag}
                      disabled={tagLoading}
                      className="rounded-lg bg-green-500 text-white h-9 px-2"
                    >
                      <Check className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setEditingTagId(null)}
                      className="rounded-lg h-9 px-2 text-gray-500"
                    >
                      <X className="size-4" />
                    </Button>
                  </div>
                );
              }

              return (
                <div key={tag.id} className="glass flex items-center justify-between rounded-xl p-3">
                  <div className="flex items-center gap-2">
                    <span className="size-3 rounded-full" style={{ backgroundColor: tag.color }} />
                    <span className="font-medium text-gray-800">{tag.name}</span>
                    <span className="rounded-full bg-black/5 px-1.5 py-0.5 text-xs text-gray-500">
                      {count} 个网站
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingTagId(tag.id);
                        setEditTagForm({ name: tag.name, color: tag.color });
                      }}
                      className="rounded-lg h-8 px-2 text-gray-500 hover:text-gray-700"
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteConfirm({ type: "tag", id: tag.id, name: tag.name })}
                      className="rounded-lg h-8 px-2 text-red-500 hover:bg-red-50"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
            {tags.length === 0 && (
              <p className="text-center text-sm text-gray-400 py-4">暂无标签</p>
            )}
          </div>
        </div>

        {/* Delete Confirmation Overlay */}
        {deleteConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30">
            <div className="glass-strong rounded-2xl p-6 max-w-sm shadow-xl">
              <p className="text-sm font-semibold text-gray-800">
                确认删除「{deleteConfirm.name}」？
              </p>
              <p className="mt-2 text-xs text-gray-500">
                {deleteConfirm.type === "folder"
                  ? "该文件夹下的网站将移除文件夹归属，但不会被删除。"
                  : "从所有网站中移除该标签关联。"}
              </p>
              <div className="mt-4 flex items-center gap-2">
                <Button
                  variant="ghost"
                  onClick={() => setDeleteConfirm(null)}
                  className="rounded-xl text-gray-600"
                >
                  取消
                </Button>
                <Button
                  onClick={handleDelete}
                  disabled={deleteLoading}
                  className="rounded-xl bg-red-500 text-white"
                >
                  {deleteLoading ? "删除中..." : "确认删除"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
