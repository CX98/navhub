import { useState, useEffect } from "react";
import { Plus, Loader2, FolderIcon, TagIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Folder, Tag, Site, SiteTag } from "@/types";

interface SiteFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Site> & { tag_ids: number[] }) => Promise<void>;
  folders: Folder[];
  tags: Tag[];
  editingSite?: Site | null;
}

export function SiteFormDialog({
  open,
  onClose,
  onSubmit,
  folders,
  tags,
  editingSite,
}: SiteFormDialogProps) {
  const [form, setForm] = useState({
    title: "",
    description: "",
    url: "",
    usage_guide: "",
    folder_id: "",
  });
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (editingSite) {
      setForm({
        title: editingSite.title || "",
        description: editingSite.description || "",
        url: editingSite.url || "",
        usage_guide: editingSite.usage_guide || "",
        folder_id: editingSite.folder_id ? String(editingSite.folder_id) : "",
      });
      setSelectedTagIds((editingSite.tags || []).map((t: SiteTag) => t.id));
    } else {
      setForm({ title: "", description: "", url: "", usage_guide: "", folder_id: "" });
      setSelectedTagIds([]);
    }
  }, [editingSite, open]);

  const toggleTag = (tagId: number) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.url.trim()) return;

    setSubmitting(true);
    try {
      await onSubmit({
        title: form.title.trim(),
        description: form.description.trim(),
        url: form.url.trim(),
        usage_guide: form.usage_guide.trim(),
        folder_id: form.folder_id ? Number(form.folder_id) : null,
        tag_ids: selectedTagIds,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="glass-dialog-content max-w-lg rounded-2xl border-white/60">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-gray-800">
            {editingSite ? "编辑网站" : "添加网站"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">网站名称 *</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="例如：GitHub"
              className="glass-input rounded-xl border-white/40 text-gray-800 placeholder:text-gray-400"
              required
            />
          </div>

          {/* URL */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">网站地址 *</Label>
            <Input
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              placeholder="https://..."
              type="url"
              className="glass-input rounded-xl border-white/40 text-gray-800 placeholder:text-gray-400"
              required
            />
          </div>

          {/* Folder */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">
              <FolderIcon className="inline size-3.5 mr-1" />
              所属文件夹
            </Label>
            <Select
              value={form.folder_id}
              onValueChange={(v) => setForm({ ...form, folder_id: v })}
            >
              <SelectTrigger className="glass-input rounded-xl border-white/40 text-gray-800">
                <SelectValue placeholder="选择文件夹..." />
              </SelectTrigger>
              <SelectContent className="glass-strong rounded-xl border-white/50">
                {folders.map((folder) => (
                  <SelectItem key={folder.id} value={String(folder.id)}>
                    <span className="inline-flex items-center gap-2">
                      <span
                        className="size-2.5 rounded-full"
                        style={{ backgroundColor: folder.color }}
                      />
                      {folder.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tags (multi-select) */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">
              <TagIcon className="inline size-3.5 mr-1" />
              标签（可多选）
            </Label>
            <div className="glass flex flex-wrap gap-2 rounded-xl p-3 border-white/40 min-h-[44px]">
              {tags.length === 0 ? (
                <span className="text-sm text-gray-400">暂无标签，请先在管理中创建</span>
              ) : (
                tags.map((tag) => {
                  const isSelected = selectedTagIds.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                        isSelected
                          ? "shadow-sm"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                      style={isSelected
                        ? { backgroundColor: tag.color + "30", color: tag.color, borderColor: tag.color }
                        : {}
                      }
                    >
                      <span
                        className="size-2 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      {tag.name}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">网站介绍</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="简要描述这个网站的用途..."
              rows={2}
              className="glass-input rounded-xl border-white/40 text-gray-800 placeholder:text-gray-400 resize-none"
            />
          </div>

          {/* Usage Guide */}
          <div className="space-y-1.5">
            <Label className="text-sm font-medium text-gray-700">使用详情</Label>
            <Textarea
              value={form.usage_guide}
              onChange={(e) => setForm({ ...form, usage_guide: e.target.value })}
              placeholder="如何使用这个网站？有哪些注意事项？"
              rows={3}
              className="glass-input rounded-xl border-white/40 text-gray-800 placeholder:text-gray-400 resize-none"
            />
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="rounded-xl text-gray-600 hover:bg-white/40"
            >
              取消
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md hover:from-indigo-600 hover:to-purple-600"
            >
              {submitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Plus className="size-4" />
              )}
              {editingSite ? "保存" : "添加"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
